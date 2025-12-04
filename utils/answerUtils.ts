export function convertAnswerToIndex(answer: any): number {
  if (answer === null || answer === undefined || answer === '') {
    return -1;
  }
  
  if (typeof answer === 'number') {
    return answer;
  }
  
  if (typeof answer === 'string') {
    if (answer.length === 1 && answer >= 'A' && answer <= 'D') {
      return answer.charCodeAt(0) - 65;
    } else if (answer.length === 1 && answer >= '0' && answer <= '3') {
      return parseInt(answer);
    } else {
      const parsed = parseInt(answer);
      return !isNaN(parsed) ? parsed : -1;
    }
  }
  
  return -1;
}

export function convertAnswerToLetter(answer: any): string {
  const index = convertAnswerToIndex(answer);
  return String.fromCharCode(65 + (index === -1 ? 0 : index));
}


export function convertCorrectAnswerToIndex(correctAnswer: any): number {
  if (correctAnswer === null || correctAnswer === undefined || correctAnswer === '') {
    return -1;
  }
  
  if (typeof correctAnswer === 'number') {
    return correctAnswer;
  }
  
  if (typeof correctAnswer === 'string') {
    if (correctAnswer.match(/^[A-D]$/)) {
      return correctAnswer.charCodeAt(0) - 65;
    } else {
      const num = parseInt(correctAnswer);
      return !isNaN(num) && num >= 0 && num <= 3 ? num : -1;
    }
  }
  
  return -1;
}

export function checkAnswerCorrect(userAnswer: any, correctAnswer: any): boolean {
  const userIndex = convertAnswerToIndex(userAnswer);
  const correctIndex = convertCorrectAnswerToIndex(correctAnswer);
  
  if (userIndex === -1 || correctIndex === -1) {
    return false;
  }
  
  return userIndex === correctIndex;
}

export function normalizeAnswerForBackend(answer: any): number {
  const index = convertAnswerToIndex(answer);
  return index === -1 ? 0 : index;
}
