# My React Native App

This is a simple React Native application that includes a login screen and a home screen. The application allows users to log in with their email and password.

## Project Structure

```
my-react-native-app
├── src
│   ├── components
│   │   └── LoginScreen.tsx      # Contains the LoginScreen component
│   ├── navigation
│   │   └── AppNavigator.tsx      # Sets up the navigation for the app
│   ├── screens
│   │   └── HomeScreen.tsx        # Represents the main screen after login
│   └── App.tsx                   # Entry point of the application
├── package.json                   # npm configuration file
├── tsconfig.json                  # TypeScript configuration file
└── README.md                      # Documentation for the project
```

## Installation
1. Navigate to the project directory:
   ```
   cd my-react-native-app
   ```
2. Install the dependencies:
   ```
   npm install
   ```

## Running the App

To run the application, use the following command:
```
npm start
```

This will start the Metro bundler. You can then run the app on an emulator or a physical device.

## Features

- User authentication with a login form
- Navigation between the login screen and the home screen

## Contributing

Feel free to submit issues or pull requests for any improvements or features you would like to see!
