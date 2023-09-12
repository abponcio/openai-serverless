import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Quizzer from "./functions/quizzer";
import RecipeRecommendation from "./functions/recipe-recommendation";

export const hello = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "No API Key provided",
        input: event,
      }),
    };
  }

  const quizzer = new Quizzer(process.env.OPEN_AI_SECRET_KEY);
  const body = JSON.parse(event.body || "{}");
  const results = await quizzer.createTestPrompt(
    body.topic,
    body.num_questions,
    body.num_answers
  );

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      results,
      input: event,
    }),
  };
};

export const generateRecipes = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!process.env.OPEN_AI_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "No API Key provided",
        input: event,
      }),
    };
  }

  const recipeRecommendation = new RecipeRecommendation(
    process.env.OPEN_AI_SECRET_KEY
  );
  const ingredients =
    event.queryStringParameters?.ingredients?.split(",") || [];

  if (!ingredients.length) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        results: [],
        input: event,
      }),
    };
  }

  const results = await recipeRecommendation.createRecipePrompt(ingredients);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      results,
      input: event,
    }),
  };
};

export const generateRecipeImage = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!process.env.OPEN_AI_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "No API Key provided",
        input: event,
      }),
    };
  }

  const recipeRecommendation = new RecipeRecommendation(
    process.env.OPEN_AI_SECRET_KEY
  );
  const recipeTitle = event.queryStringParameters?.title || "";

  if (!recipeTitle) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        results: [],
        input: event,
      }),
    };
  }

  const results = await recipeRecommendation.createImagePrompt(recipeTitle);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      results,
      input: event,
    }),
  };
};
