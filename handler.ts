import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Quizzer from "./functions/quizzer";

export const hello = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};

export const generateQuiz = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!process.env.OPEN_AI_SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "No API Key provided",
        input: event,
      }),
    };
  }

  const quizzer = new Quizzer(process.env.OPEN_AI_SECRET_KEY);

  const results = await quizzer.createTestPrompt("science", 5, 4);

  return {
    statusCode: 200,
    body: JSON.stringify({
      results,
      input: event,
    }),
  };
};
