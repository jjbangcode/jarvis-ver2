"""Independent Apple Calendar schedule briefing agent."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .agent import CalendarEvent, ScheduleBriefingAgent

__all__ = ["CalendarEvent", "ScheduleBriefingAgent"]


def __getattr__(name: str) -> Any:
    if name in __all__:
        from . import agent

        return getattr(agent, name)
    raise AttributeError(name)
