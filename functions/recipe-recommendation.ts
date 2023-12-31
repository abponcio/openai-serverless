import OpenAI from "openai";
import * as uuid from "uuid";

import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

export default class RecipeRecommendation {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    this.model = "gpt-3.5-turbo";
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async createRecipePrompt(ingredients: string[]) {
    let prompt = `Create a new recipe using just only ${ingredients.join(
      ", "
    )} and common pantry ingredients at home.
I want to content to format like this:

Title: [Recipe name]
__[Enter ingredient 1]
__[Enter ingredient 2]
__[Enter ingredient 3]

-- [Enter step 1 description]
-- [Enter step 2 description]
-- [Enter step 3 description]`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.choices[0].message.content) {
      return { recipe: {} };
    }

    const content = response.choices[0].message.content;

    const recipes = this.getRecipes(content);

    // TODO: save generated recipes in dynamodb
    await this.saveRecipes(recipes);

    return recipes;
  }

  async saveRecipes(recipes) {
    const timestamp = new Date().getTime();
    if (!recipes.length || !process.env.DYNAMODB_TABLE) {
      console.warn("Nothing to save");
      return;
    }

    for (const recipe of recipes) {
      const timestamp = new Date().getTime();
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: uuid.v1(),
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      };

      // write to the database
      dynamoDb.put(params, (error, result) => {
        // handle potential errors
        if (error) {
          console.error(error);
          return;
        }

        console.log(result);
      });
    }
  }

  async createImagePrompt(title: string) {
    const imagePrompt = `Create professional studio style top view image of the recipe ${title} in a plate`;
    const response = await this.openai.images.generate({
      prompt: imagePrompt,
      size: "512x512",
    });

    return response.data[0].url;
  }

  getRecipes(content: string) {
    let recipes: any = [];
    let index = 0;

    for (const line of content.split("\n")) {
      if (!recipes[index]) {
        recipes[index] = {
          title: "",
          steps: [],
          ingredients: [],
        };
      }

      if (line.startsWith("Title:")) {
        if (recipes[index].title !== "") {
          index++;

          if (!recipes[index]) {
            recipes[index] = {
              title: "",
              steps: [],
              ingredients: [],
            };
          }
        }

        recipes[index].title = line.replace("Title:", "").trim();
      }

      if (line.includes("__")) {
        recipes[index].ingredients.push(
          line.replace("__", "").replace("-", "").trim()
        );
      }

      if (line.startsWith("--")) {
        recipes[index].steps.push(line.replace("--", "").trim());
      }
    }

    return recipes;
  }
}
