package logging

import (
	"encoding/json"
	"io"
	"os"
	"sync"
	"time"
)

type Logger struct {
	mu    sync.Mutex
	out   io.Writer
	level string
}

func New(level string) *Logger {
	if level == "" {
		level = "info"
	}
	return &Logger{out: os.Stdout, level: level}
}

func (l *Logger) Info(msg string, fields map[string]any)  { l.write("info", msg, fields) }
func (l *Logger) Warn(msg string, fields map[string]any)  { l.write("warn", msg, fields) }
func (l *Logger) Error(msg string, fields map[string]any) { l.write("error", msg, fields) }

func (l *Logger) write(level, msg string, fields map[string]any) {
	entry := map[string]any{
		"ts":    time.Now().UTC().Format(time.RFC3339Nano),
		"level": level,
		"msg":   msg,
	}
	for k, v := range fields {
		entry[k] = v
	}
	b, err := json.Marshal(entry)
	if err != nil {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	_, _ = l.out.Write(append(b, '\n'))
}
