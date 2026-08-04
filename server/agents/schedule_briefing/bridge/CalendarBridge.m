#import <EventKit/EventKit.h>
#import <Foundation/Foundation.h>

static void finish(NSDictionary *payload, int exitCode) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:NSJSONWritingSortedKeys error:nil];
    NSString *json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    printf("%s\n", json.UTF8String);
    exit(exitCode);
}

static NSString *trimmed(NSString *value) {
    return [value stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc == 1) {
            EKEventStore *permissionStore = [[EKEventStore alloc] init];
            if (@available(macOS 14.0, *)) {
                EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
                if (status == EKAuthorizationStatusFullAccess) {
                    finish(@{ @"authorized": @YES }, 0);
                }
                if (status == EKAuthorizationStatusDenied || status == EKAuthorizationStatusRestricted ||
                    status == EKAuthorizationStatusWriteOnly) {
                    finish(@{
                        @"error": @"Calendar access is not allowed. Enable it in System Settings > Privacy & Security > Calendars.",
                        @"code": @"permission_denied",
                    }, 3);
                }

                dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
                __block BOOL granted = NO;
                __block NSError *requestError = nil;
                [permissionStore requestFullAccessToEventsWithCompletion:^(BOOL accessGranted, NSError *error) {
                    granted = accessGranted;
                    requestError = error;
                    dispatch_semaphore_signal(semaphore);
                }];
                dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
                if (granted) finish(@{ @"authorized": @YES }, 0);
                finish(@{
                    @"error": requestError.localizedDescription ?: @"Calendar access was not granted.",
                    @"code": @"permission_denied",
                }, 3);
            }
            finish(@{ @"error": @"This bridge requires macOS 14 or later.", @"code": @"unsupported_macos" }, 4);
        }

        if (argc != 3) {
            finish(@{ @"error": @"Expected start and end Unix timestamps", @"code": @"invalid_arguments" }, 2);
        }

        NSTimeInterval startTimestamp = strtod(argv[1], NULL);
        NSTimeInterval endTimestamp = strtod(argv[2], NULL);
        NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startTimestamp];
        NSDate *endDate = [NSDate dateWithTimeIntervalSince1970:endTimestamp];
        if ([startDate compare:endDate] != NSOrderedAscending) {
            finish(@{ @"error": @"Start must be earlier than end", @"code": @"invalid_range" }, 2);
        }

        EKEventStore *store = [[EKEventStore alloc] init];
        NSISO8601DateFormatter *formatter = [[NSISO8601DateFormatter alloc] init];
        formatter.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;

        void (^readEvents)(void) = ^{
            NSPredicate *predicate = [store predicateForEventsWithStartDate:startDate endDate:endDate calendars:nil];
            NSArray<EKEvent *> *events = [[store eventsMatchingPredicate:predicate]
                sortedArrayUsingComparator:^NSComparisonResult(EKEvent *left, EKEvent *right) {
                    if (left.isAllDay != right.isAllDay) return left.isAllDay ? NSOrderedAscending : NSOrderedDescending;
                    return [left.startDate compare:right.startDate];
                }];

            NSMutableArray *items = [NSMutableArray arrayWithCapacity:events.count];
            for (EKEvent *event in events) {
                NSString *title = trimmed(event.title ?: @"");
                NSString *location = trimmed(event.location ?: @"");
                [items addObject:@{
                    @"id": event.eventIdentifier ?: event.calendarItemIdentifier ?: @"",
                    @"title": title.length ? title : @"제목 없는 일정",
                    @"start": [formatter stringFromDate:event.startDate],
                    @"end": [formatter stringFromDate:event.endDate],
                    @"allDay": @(event.isAllDay),
                    @"calendar": event.calendar.title ?: @"",
                    @"location": location.length ? location : NSNull.null,
                }];
            }
            finish(@{ @"events": items }, 0);
        };

        if (@available(macOS 14.0, *)) {
            EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
            if (status == EKAuthorizationStatusFullAccess) readEvents();
            if (status == EKAuthorizationStatusDenied || status == EKAuthorizationStatusRestricted ||
                status == EKAuthorizationStatusWriteOnly) {
                finish(@{
                    @"error": @"Calendar access is not allowed. Enable it in System Settings > Privacy & Security > Calendars.",
                    @"code": @"permission_denied",
                }, 3);
            }
            if (status == EKAuthorizationStatusNotDetermined) {
                dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
                __block BOOL granted = NO;
                __block NSError *requestError = nil;
                [store requestFullAccessToEventsWithCompletion:^(BOOL accessGranted, NSError *error) {
                    granted = accessGranted;
                    requestError = error;
                    dispatch_semaphore_signal(semaphore);
                }];
                dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
                if (granted) readEvents();
                finish(@{
                    @"error": requestError.localizedDescription ?: @"Calendar access was not granted.",
                    @"code": @"permission_denied",
                }, 3);
            }
            finish(@{ @"error": @"Unknown calendar authorization state.", @"code": @"permission_unknown" }, 3);
        }

        finish(@{ @"error": @"This bridge requires macOS 14 or later.", @"code": @"unsupported_macos" }, 4);
    }
}
