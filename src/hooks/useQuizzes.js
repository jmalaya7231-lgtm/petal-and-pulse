import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../lib/format.js";

const MAX_ATTEMPTS = 2000;

export default function useQuizzes() {
  const [quizzes, setQuizzes] = useLocalStorage("pp:quizzes", []);
  // One entry per completed full quiz. The progress page will use this later.
  const [attempts, setAttempts] = useLocalStorage("pp:quizAttempts", []);

  // data = { title, subject, questions }. Pass an id to update an existing quiz.
  function saveQuiz(data, id) {
    const now = new Date().toISOString();
    if (id) {
      setQuizzes(
        quizzes.map((q) =>
          q.id === id
            ? {
                ...q,
                title: data.title,
                subject: data.subject,
                questions: data.questions,
                updatedAt: now,
              }
            : q
        )
      );
      return id;
    }
    const newId = makeId();
    setQuizzes([
      {
        id: newId,
        title: data.title,
        subject: data.subject,
        questions: data.questions,
        createdAt: now,
        updatedAt: now,
      },
      ...quizzes,
    ]);
    return newId;
  }

  function deleteQuiz(id) {
    setQuizzes(quizzes.filter((q) => q.id !== id));
  }

  // Score history keeps its own copy of the title and subject,
  // so it stays accurate even if the quiz is edited or deleted later.
  function recordAttempt(quiz, score, total) {
    setAttempts(
      [
        ...attempts,
        {
          id: makeId(),
          quizId: quiz.id,
          quizTitle: quiz.title,
          subject: quiz.subject,
          at: new Date().toISOString(),
          score,
          total,
        },
      ].slice(-MAX_ATTEMPTS)
    );
  }

  return { quizzes, attempts, saveQuiz, deleteQuiz, recordAttempt };
}