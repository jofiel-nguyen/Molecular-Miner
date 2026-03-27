const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let studentName = "";
let score = 0;
let combo = 1; 
let timeLeft = 300; 
let gameState = 'waiting'; 
let angle = 0;
let angleDir = 0.035;
let clawLength = 80;
let currentClawSize = 18;
const baseClawSize = 18;
let launchSpeed = 18;
let caughtItem = null;
let bossActive = false;
let shakeAmount = 0;
const minerPos = { x: canvas.width / 2, y: 150 };

let boss = { x: canvas.width / 2, y: canvas.height - 150, hp: 100, targetElement: "Gold", dir: 2 };
let projectiles = [];
let items = [];
let bgStars = [];

const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#FFD700", textColor: "#000", size: 45 },
    { name: "Silver (Ag)", type: "Element", color: "#E0E0E0", textColor: "#000", size: 40 },
    { name: "Water (H2O)", type: "Compound", color: "#00BFFF", textColor: "#fff", size: 48 },
    { name: "Salt (NaCl)", type: "Compound", color: "#FFFFFF", textColor: "#333", size: 45 },
    { name: "Brass", type: "Mixture", color: "#CD7F32", textColor: "#fff", size: 52 },
    { name: "Granite", type: "Mixture", color: "#808080", textColor: "#fff", size: 55 }
];