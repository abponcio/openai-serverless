import OpenAI from "openai";

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
    let prompt = `Create 2 new recipes using just only with ${ingredients.join(
      ", "
    )} and common pantry ingredients.
Include the ingredients and instructions for each recipe.
format each ingredients with '__' in the beginning and format each instructions with '--' in the beginning.
Prepend Title: to the recipe title.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });

    if (!response.choices[0].message.content) {
      return { recipe: {} };
    }

    const content = response.choices[0].message.content;

    const recipes = this.getRecipes(content);

    return recipes;
  }

  async createImagePrompt(title: string) {
    const imagePrompt = `Create professional studio style top view image of the recipe ${title} in a plate`;
    const response = await this.openai.images.generate({
      prompt: title,
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
