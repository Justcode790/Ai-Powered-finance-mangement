import React, { useEffect, useState } from 'react';
import { getModuleById, updateModuleProgress } from '../services/api';
import { BookOpen, CheckCircle, Circle, Clock, Award } from 'lucide-react';

const LearningModule = ({ moduleId, onClose }) => {
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModule();
  }, [moduleId]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await getModuleById(moduleId);
      setModule(data.module);
      setProgress(data.progress);
    } catch (err) {
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async () => {
    try {
      await updateModuleProgress(moduleId, { lessonId: null, completed: false });
      await loadModule();
    } catch (err) {
      console.error('Error starting module:', err);
    }
  };

  const handleLessonComplete = async (lessonId) => {
    try {
      await updateModuleProgress(moduleId, { lessonId, completed: true });
      await loadModule();
      setCurrentLesson(null);
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  };

  const handleQuizSubmit = async (lessonId) => {
    try {
      const score = calculateQuizScore(lessonId);
      await updateModuleProgress(moduleId, { lessonId, completed: true, quizScore: score });
      await loadModule();
      setCurrentLesson(null);
      setQuizAnswers({});
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  const calculateQuizScore = (lessonId) => {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.quiz) return 0;

    let correct = 0;
    lesson.quiz.forEach((question, idx) => {
      if (quizAnswers[idx] === question.correctAnswer) {
        correct++;
      }
    });

    return Math.round((correct / lesson.quiz.length) * 100);
  };

  const isLessonCompleted = (lessonId) => {
    return progress?.lessonsCompleted?.includes(lessonId) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading module...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-400">Module not found</p>
      </div>
    );
  }

  // Show lesson detail view
  if (currentLesson) {
    const lesson = module.lessons.find(l => l.id === currentLesson);
    if (!lesson) return null;

    return (
      <div className="space-y-6">
        <div className="card">
          <button
            onClick={() => setCurrentLesson(null)}
            className="text-sm text-slate-400 hover:text-slate-200 mb-4"
          >
            ← Back to Module
          </button>

          <h2 className="text-xl font-semibold text-slate-50 mb-4">{lesson.title}</h2>
          
          <div className="prose prose-invert prose-sm max-w-none mb-6">
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          </div>

          {/* Quiz */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <div className="space-y-4 mt-6 pt-6 border-t border-slate-800">
              <p className="text-sm font-semibold text-slate-200">Quiz</p>
              {lesson.quiz.map((question, idx) => (
                <div key={idx} className="bg-slate-900/60 rounded-xl p-4">
                  <p className="text-sm text-slate-200 mb-3">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${idx}`}
                          value={optIdx}
                          checked={quizAnswers[idx] === optIdx}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                          className="text-emerald-500"
                        />
                        <span className="text-sm text-slate-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleQuizSubmit(lesson.id)}
                disabled={Object.keys(quizAnswers).length < lesson.quiz.length}
                className="w-full px-4 py-3 bg-emerald-500 text-slate-950 rounded-xl font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            </div>
          )}

          {/* Complete Lesson Button (if no quiz) */}
          {(!lesson.quiz || lesson.quiz.length === 0) && (
            <button
              onClick={() => handleLessonComplete(lesson.id)}
              className="w-full px-4 py-3 bg-emerald-500 text-slate-950 rounded-xl font-semibold text-sm hover:bg-emerald-400 mt-6"
            >
              Mark as Complete
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show module overview
  return (
    <div className="space-y-6">
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back
        </button>
      )}

      {/* Module Header */}
      <div className="card">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="text-emerald-400" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2">
              {module.title}
            </h1>
            <p className="text-sm text-slate-400 mb-3">{module.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                {module.category}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 capitalize">
                {module.difficulty}
              </span>
              {module.estimatedHours && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {module.estimatedHours}h estimated
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Progress</p>
              <p className="text-xs text-emerald-400 font-semibold">
                {Math.round(progress.overallProgress || 0)}%
              </p>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progress.overallProgress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Start Module Button */}
        {!progress && (
          <button
            onClick={handleStartModule}
            className="w-full px-4 py-3 bg-emerald-500 text-slate-950 rounded-xl font-semibold text-sm hover:bg-emerald-400"
          >
            Start Module
          </button>
        )}
      </div>

      {/* Lessons List */}
      <div className="card">
        <p className="text-sm font-semibold text-slate-200 mb-4">Lessons</p>
        <div className="space-y-3">
          {module.lessons && module.lessons.map((lesson, idx) => {
            const completed = isLessonCompleted(lesson.id);
            return (
              <div
                key={lesson.id}
                className={`bg-slate-900/60 border rounded-xl p-4 transition-colors cursor-pointer ${
                  completed
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setCurrentLesson(lesson.id)}
              >
                <div className="flex items-start gap-3">
                  {completed ? (
                    <CheckCircle className="text-emerald-400 flex-shrink-0" size={20} />
                  ) : (
                    <Circle className="text-slate-600 flex-shrink-0" size={20} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200 mb-1">
                      {idx + 1}. {lesson.title}
                    </p>
                    {lesson.duration && (
                      <p className="text-xs text-slate-500">{lesson.duration} min</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Badge */}
      {progress?.completedAt && (
        <div className="card bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Award className="text-emerald-400" size={24} />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Module Completed!</p>
              <p className="text-xs text-slate-400">
                Completed on {new Date(progress.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningModule;
