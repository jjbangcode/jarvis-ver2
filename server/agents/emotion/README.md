# Emotion Agent

JARVIS의 기존 STT와 `emotion2vec` 음성 감정 분석을 병렬 실행하고, 감정에 맞춘 시스템 프롬프트를 Qwen2.5에 전달하는 독립 에이전트입니다.

## 설치 및 독립 실행

```bash
cd server
./.venv/bin/pip install -r agents/emotion/requirements.txt
./.venv/bin/python -m agents.emotion.processor /path/to/voice.wav
```

기본 SER 모델은 Hugging Face의 `emotion2vec/emotion2vec_plus_large`입니다. ModelScope의 동일 모델이나
다른 모델을 사용하려면 서버 실행 전에 다음과 같이 지정합니다.

```bash
export JARVIS_EMOTION_HUB=ms
export JARVIS_EMOTION_MODEL=iic/emotion2vec_plus_seed
```

모델 로딩 또는 추론이 실패하거나 제한 시간을 넘으면 감정은 항상 `neutral`로 폴백합니다. 모델은 첫 요청 시 한 번만 지연 로딩됩니다.

## 테스트

테스트는 실제 모델이나 Ollama 없이 의존성을 주입해 실행합니다.

```bash
cd server
./.venv/bin/python -m unittest discover -s agents/emotion/tests -v
```
