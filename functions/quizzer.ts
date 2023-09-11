import OpenAI from "openai";

export default class Quizzer {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    this.model = "gpt-3.5-turbo";
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async createTestPrompt(
    topic: string,
    numQuestions: number,
    numPossibleAnswers: number
  ) {
    let prompt = `Create a multiple choice quiz on the topic about ${topic}. `;
    prompt += `with ${numQuestions} questions that starts with 'Q#: ' that is based on a fact and not opinionated. `;
    prompt += `Each question should have ${numPossibleAnswers} possible answers with only one possible correct answer that starts with capital letter bullet points with this format 'A. '. `;
    prompt += `Also include the correct answer for each question with a starting string of 'Correct Answer: '`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.choices[0].message.content) {
      return { questions: {}, answers: {} };
    }

    const studentQuestions = this.createStudentView(
      response.choices[0].message.content,
      numQuestions
    );

    const answerQuestions = this.createAnswersView(
      response.choices[0].message.content,
      numQuestions
    );

    return { questions: studentQuestions, answers: answerQuestions };
  }

  private createStudentView(quiz: string, numQuestions: number) {
    const studentView: { [questionNumber: number]: string } = {};
    let questionNumber = 1;

    for (const line of quiz.split("\n")) {
      if (!line.startsWith("Correct Answer:")) {
        if (!studentView[questionNumber]) {
          studentView[questionNumber] = "";
        }
        studentView[questionNumber] += line + "\n";
      } else {
        if (questionNumber < numQuestions) {
          questionNumber++;
        }
      }
    }

    return studentView;
  }

  private createAnswersView(quiz: string, numQuestions: number) {
    const answerView: { [questionNumber: number]: string } = {};
    let questionNumber = 1;

    for (const line of quiz.split("\n")) {
      if (line.startsWith("Correct Answer:")) {
        if (!answerView[questionNumber]) {
          answerView[questionNumber] = "";
        }
        answerView[questionNumber] += line + "\n";
        if (questionNumber < numQuestions) {
          questionNumber++;
        }
      }
    }

    return answerView;
  }
}
