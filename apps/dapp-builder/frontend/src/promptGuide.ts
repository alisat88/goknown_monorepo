export interface IPromptSection {
  id: string;
  heading: string;
  content: string;
  annotation?: string;
}

export const PROMPT_GUIDE_INTRO =
  "Clear prompts help DApp Builder understand what to create. A strong prompt explains the app’s purpose, target user, core features, design, fallback behavior, API needs, interactions, and final expected behavior.";

export const PROMPT_CHECKLIST = [
  'App name',
  'Purpose',
  'Target user',
  'Core features',
  'Visual design',
  'API or data requirements',
  'Fallback/demo behavior',
  'Interactions',
  'Final preview/save behavior',
] as const;

export const PROMPT_OPENING =
  'Create a working weather app called “Smart Weather Planner.”';

export const PROMPT_SECTIONS: IPromptSection[] = [
  {
    id: 'purpose',
    heading: 'Purpose',
    content:
      'The app helps users check the current weather for any city and get simple outfit and activity recommendations based on the forecast.',
    annotation: 'This tells DApp Builder what problem the app solves.',
  },
  {
    id: 'target-user',
    heading: 'Target user',
    content:
      'A normal non-technical person who wants to quickly know:\n• What is the weather like right now?\n• What should I wear?\n• Should I bring an umbrella?\n• Is it a good day for walking, driving, outdoor work, or staying indoors?',
    annotation: 'This helps the app choose the right tone, layout, and complexity.',
  },
  {
    id: 'core-features',
    heading: 'Core features — 1. City search',
    content:
      '• Add a search input where the user can type a city name.\n• Add a button labeled “Get Weather.”\n• Default example city should be “Fort Lauderdale.”',
    annotation: 'Specific features reduce ambiguity and prevent a blank or generic app.',
  },
  {
    id: 'weather-card',
    heading: '2. Current weather card',
    content:
      'After the user searches, show a weather summary card with:\n• City name\n• Current temperature\n• Feels-like temperature\n• Weather condition (sunny, cloudy, rainy, stormy, windy, or humid)\n• Humidity\n• Wind speed\n• Chance of rain\n• Local time if available',
    annotation: 'Listing exact fields helps the preview generate real UI cards.',
  },
  {
    id: 'outfit',
    heading: '3. Outfit recommendation',
    content:
      'Based on the weather, show a card titled “What to Wear.”\nExamples:\n• Hot and sunny: light clothes, sunglasses, sunscreen\n• Rainy: umbrella, waterproof shoes, light jacket\n• Windy: secure loose clothing, light jacket\n• Cool: sweater or light coat\n• Stormy: avoid unnecessary outdoor plans',
    annotation: 'Examples teach the app what type of logic and output to create.',
  },
  {
    id: 'activity',
    heading: '4. Activity recommendation',
    content:
      'Show a card titled “Best Plan Today.” Give a short recommendation such as:\n• Great day for a walk\n• Good day for indoor work\n• Bring an umbrella if going out\n• Avoid long outdoor activities during storms\n• Good driving conditions\n• Stay hydrated in high heat',
    annotation: undefined,
  },
  {
    id: 'forecast',
    heading: '5. Simple 3-day forecast',
    content:
      'Show a small forecast section with 3 cards: Today, Tomorrow, Next day.\nEach card should show:\n• High temperature\n• Low temperature\n• Weather condition\n• Rain chance',
    annotation: 'This defines the exact structure of a repeatable section.',
  },
  {
    id: 'visual-design',
    heading: '6. Visual design',
    content:
      'Make the app look polished and demo-ready:\n• Clean modern dashboard layout\n• Weather-themed gradient background\n• Large readable cards\n• Friendly icons or emojis for sun, clouds, rain, wind, and storms\n• Mobile-friendly layout\n• Clear buttons and readable text',
    annotation: 'Design instructions help the preview look polished instead of plain.',
  },
  {
    id: 'fallback',
    heading: '7. Demo/fallback behavior',
    content:
      'This app must work in preview even if a real weather API key is not available yet. If the weather API is not connected or the API request fails, show realistic demo weather data instead of breaking.\n\nFallback demo data:\nCity: Fort Lauderdale\nTemperature: 84°F / Feels like: 91°F\nCondition: Partly Cloudy / Humidity: 72%\nWind: 12 mph / Rain chance: 35%\nRecommendation: “Warm and humid. Wear light clothes and bring water. Keep an umbrella nearby just in case.”\n\nNote (if needed): “Demo weather data shown. Connect a weather API for live results.”',
    annotation: 'Fallback data makes the app work during demos even without an API key.',
  },
  {
    id: 'api',
    heading: '8. API behavior',
    content:
      'If a weather API is available, use it to fetch real weather by city. If no API is configured, use the fallback demo data. Do not expose API keys in the browser. Do not ask the user to copy code into a repo. The app should run directly inside DApp Builder preview.',
    annotation: 'This clarifies live-data behavior and protects API keys.',
  },
  {
    id: 'interactions',
    heading: '9. Interactions',
    content:
      'The app should be interactive:\n• User can type a city\n• User can click “Get Weather”\n• The weather cards update\n• Loading state appears while fetching\n• Error state is friendly and falls back to demo data',
    annotation: 'Interactive requirements make the preview testable.',
  },
  {
    id: 'final',
    heading: '10. Final app behavior',
    content:
      'The preview should show the full working app interface, not just a title or blank page. The app should be saveable to the DApp Builder library. When opened later from the library, it should still show the working weather app.',
    annotation:
      'This tells DApp Builder that the result must be a working app, not just generated code.',
  },
];

// Raw prompt text for the "Copy Example Prompt" button.
// Annotations are excluded — this is exactly what a user would paste into DApp Builder.
export const EXAMPLE_PROMPT_RAW = `Create a working weather app called "Smart Weather Planner."

Purpose:
The app helps users check the current weather for any city and get simple outfit and activity recommendations based on the forecast.

Target user:
A normal non-technical person who wants to quickly know:
• What is the weather like right now?
• What should I wear?
• Should I bring an umbrella?
• Is it a good day for walking, driving, outdoor work, or staying indoors?

Core features:

1. City search
• Add a search input where the user can type a city name.
• Add a button labeled "Get Weather."
• Default example city should be "Fort Lauderdale."

2. Current weather card
After the user searches, show a weather summary card with:
• City name
• Current temperature
• Feels-like temperature
• Weather condition (sunny, cloudy, rainy, stormy, windy, or humid)
• Humidity
• Wind speed
• Chance of rain
• Local time if available

3. Outfit recommendation
Based on the weather, show a card titled "What to Wear."
Examples:
• Hot and sunny: light clothes, sunglasses, sunscreen
• Rainy: umbrella, waterproof shoes, light jacket
• Windy: secure loose clothing, light jacket
• Cool: sweater or light coat
• Stormy: avoid unnecessary outdoor plans

4. Activity recommendation
Show a card titled "Best Plan Today." Give a short recommendation such as:
• Great day for a walk
• Good day for indoor work
• Bring an umbrella if going out
• Avoid long outdoor activities during storms
• Good driving conditions
• Stay hydrated in high heat

5. Simple 3-day forecast
Show a small forecast section with 3 cards: Today, Tomorrow, Next day.
Each card should show:
• High temperature
• Low temperature
• Weather condition
• Rain chance

6. Visual design
Make the app look polished and demo-ready:
• Clean modern dashboard layout
• Weather-themed gradient background
• Large readable cards
• Friendly icons or emojis for sun, clouds, rain, wind, and storms
• Mobile-friendly layout
• Clear buttons and readable text

7. Demo/fallback behavior
This app must work in preview even if a real weather API key is not available yet. If the weather API is not connected or the API request fails, show realistic demo weather data instead of breaking.

Fallback demo data:
City: Fort Lauderdale
Temperature: 84°F
Feels like: 91°F
Condition: Partly Cloudy
Humidity: 72%
Wind: 12 mph
Rain chance: 35%
Recommendation: "Warm and humid. Wear light clothes and bring water. Keep an umbrella nearby just in case."

Show a small note only if needed: "Demo weather data shown. Connect a weather API for live results."

8. API behavior
If a weather API is available, use it to fetch real weather by city. If no API is configured, use the fallback demo data. Do not expose API keys in the browser. Do not ask the user to copy code into a repo. The app should run directly inside DApp Builder preview.

9. Interactions
The app should be interactive:
• User can type a city
• User can click "Get Weather"
• The weather cards update
• Loading state appears while fetching
• Error state is friendly and falls back to demo data

10. Final app behavior
The preview should show the full working app interface, not just a title or blank page. The app should be saveable to the DApp Builder library. When opened later from the library, it should still show the working weather app.`;
