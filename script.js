const track = document.getElementById('track');
const container = document.querySelector('.carousel-container');
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');
const gap = 20;

// FUNGSI CEK TENGAH (Ditingkatkan Akurasinya)
function updateActiveCard() {
    const cards = track.querySelectorAll('.feature-card');
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardMid = cardRect.left + cardRect.width / 2;

        // Toleransi dinaikkan ke 200px agar deteksi lebih luas saat bergerak
        if (Math.abs(cardMid - centerX) < 200) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// KLIK KANAN (KARTU MAJU KE KIRI)
nextBtn.addEventListener('click', () => {
    const firstCard = track.firstElementChild;
    const moveDistance = firstCard.offsetWidth + gap;

    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${moveDistance}px)`;

    // Cek posisi berkali-kali selama animasi 500ms
    let checkInterval = setInterval(updateActiveCard, 50);

    setTimeout(() => {
        clearInterval(checkInterval);
        track.style.transition = "none";
        track.appendChild(firstCard); 
        track.style.transform = `translateX(0)`;
        updateActiveCard();
    }, 500);
});

// KLIK KIRI (KARTU MUNDUR KE KANAN)
prevBtn.addEventListener('click', () => {
    const lastCard = track.lastElementChild;
    const moveDistance = lastCard.offsetWidth + gap;

    // 1. Pindah kartu ke depan dulu (Sembunyi di kiri)
    track.style.transition = "none";
    track.prepend(lastCard);
    track.style.transform = `translateX(-${moveDistance}px)`;
    
    // Paksa browser update posisi
    track.offsetHeight; 

    // 2. Mulai animasi balik ke tengah
    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(0)`;

    // 3. Cek posisi terus menerus biar highlight sinkron
    let checkInterval = setInterval(updateActiveCard, 50);

    setTimeout(() => {
        clearInterval(checkInterval);
        updateActiveCard();
    }, 500);
});

// Jalankan saat awal
updateActiveCard();
window.addEventListener('resize', updateActiveCard);

async function kirimChat() {
    const inputElement = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const pesan = inputElement.value.trim();

    if (!pesan) return;

    // Tampilkan pesan kamu (User) dengan bubble rapi
    chatBox.innerHTML += `<div class="chat-msg user">${pesan}</div>`;
    inputElement.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('https://aetherna-production.up.railway.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: pesan })
        });

        const data = await response.json();
        
        // Tampilkan balasan bot dengan bubble rapi
        chatBox.innerHTML += `<div class="chat-msg bot">${data.reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error(error);
        chatBox.innerHTML += `<div class="system-msg" style="color: red;">Gagal terhubung ke server AetherAssist.</div>`;
    }
}