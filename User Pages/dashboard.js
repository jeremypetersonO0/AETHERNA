console.log("AETHERNA JS LOADED")

document.addEventListener("DOMContentLoaded", () => {

/* =========================
   LEVEL SYSTEM
========================= */
let level = 1
let exp = 0
let coins = 0

function expToNextLevel(level) {
return level * 200
}

function formatLevel(num){
return String(num).padStart(2,'0')
}

function addExp(amount) {

exp += amount

let needed = expToNextLevel(level)

while (exp >= needed) {

exp -= needed
level++

coins += 500

showCoinReward()   // 🔥 animasi coin
updateCoinUI()

console.log("LEVEL UP →", level)

needed = expToNextLevel(level)

}

updateLevelUI()
updateCoinUI()

}

function updateLevelUI() {

const levelTexts = document.querySelectorAll(".level")
const progress = document.querySelector(".progress-fill")
const expText = document.querySelector(".exp-text")

let needed = expToNextLevel(level)

// 🔥 Update semua level text
levelTexts.forEach(el => {
el.textContent = "Level " + formatLevel(level)
})

// Progress Bar
if(progress){
progress.style.width =
(exp / needed) * 100 + "%"
}

// Exp Text
if(expText){
expText.textContent = `${exp} / ${needed} EXP`
}

}


/* =========================
   HABIT SYSTEM + EXP
========================= */

document.querySelectorAll(".plus").forEach(btn => {

const newBtn = btn.cloneNode(true)
btn.parentNode.replaceChild(newBtn, btn)

newBtn.addEventListener("click", function (e) {
e.preventDefault()

const item = this.closest(".habit-item")
const num = item.querySelector(".number")
const bar = item.querySelector(".habit-progress")

let max = Number(item.dataset.max)
let current = Number(num.textContent)

if (isNaN(current)) current = 0

if (current < max) {

current++

num.textContent = current
bar.style.width = (current / max) * 100 + "%"

if(item.dataset.type === "water"){
addWater()
}

// 🔥 TASK COMPLETE
if (current === max && !item.dataset.done) {

item.dataset.done = "true"

addExp(60)

console.log("TASK COMPLETE +50 EXP")

}

}

})

})


/* =========================
   TAG SYSTEM
========================= */

document.querySelectorAll(".tag").forEach(tag => {
tag.addEventListener("click", () => {
tag.classList.toggle("active")
})
})


/* =========================
   WRAPPED SYSTEM
========================= */

const modal = document.getElementById("wrappedModal")
const img = document.getElementById("wrappedImage")
const bars = document.querySelectorAll(".bar")
const playBtn = document.querySelector(".play-btn")
const closeBtn = document.querySelector(".close-btn")

let index = 1
const max = 6
let timer = null

function updateWrappedUI() {

if (!img) return

img.src = `wrapped_${index}.png`

bars.forEach((b, i) => {
b.classList.toggle("active", i === index - 1)
})

}

function startWrapped() {

index = 1
updateWrappedUI()

clearInterval(timer)

timer = setInterval(() => {

index++

if (index > max) {
clearInterval(timer)
if (modal) modal.style.display = "none"
return
}

updateWrappedUI()

}, 3000)

}

if (playBtn && modal) {
playBtn.addEventListener("click", () => {
modal.style.display = "flex"
startWrapped()
})
}

if (closeBtn && modal) {
closeBtn.addEventListener("click", () => {
modal.style.display = "none"
clearInterval(timer)
})
}

if (modal) {
modal.addEventListener("click", (e) => {
if (e.target === modal) {
modal.style.display = "none"
clearInterval(timer)
}
})
}

function updateCoinUI(){

const coinText = document.querySelector(".coin-value")

if(coinText){
coinText.textContent = coins
}

}

function showCoinReward(){

const popup = document.getElementById("coinPopup")

popup.classList.add("show")

setTimeout(()=>{
popup.classList.remove("show")
},1500)

}

function showCoinReward(){

const float = document.querySelector(".coin-float")

if(!float) return

float.classList.add("show")

setTimeout(()=>{
float.classList.remove("show")
},1200)

}

let totalWater = localStorage.getItem("totalWater") || 0;

function addWater(){

totalWater++

localStorage.setItem("totalWater", totalWater)

}

})