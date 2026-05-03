import React from 'react';
import TaskList from './components/TaskList';
import ChatBubble from './components/ChatBubble';
import MatrixRain from './components/MatrixRain';
import './App.css';

export default function App() {
  return (
    <div className="app-wrapper">
      <MatrixRain />
      <div className="app">
        <h1>📝 Mes tâches</h1>
        <TaskList />
        <ChatBubble />
      </div>
    </div>
  );
}