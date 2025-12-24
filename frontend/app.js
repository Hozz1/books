// Конфигурация API
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Глобальные переменные
let accessToken = localStorage.getItem('access_token') || null;
let currentUser = null;
let currentChatId = null;
let isTyping = false;

// DOM элементы
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const typingIndicator = document.getElementById('typing-indicator');
const currentUsernameSpan = document.getElementById('current-username');
const recommendationsList = document.getElementById('recommendations-list');
const chatHistory = document.getElementById('chat-history'); // Исправлено: было chatchat-history
const newChatBtn = document.getElementById('new-chat-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли пользователь
    if (accessToken) {
        checkAuthAndLoadUser();
    } else {
        showAuthPage();
    }
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Инициализация приветственного сообщения
    initWelcomeMessage();
});

// Показать страницу аутентификации
function showAuthPage() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
}

// Показать страницу чата
function showChatPage() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    loadChatHistory(); // Исправлено: было loadChatChatHistory
}

// Инициализация приветственного сообщения
function initWelcomeMessage() {
    if (!messagesContainer.querySelector('.welcome-message')) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="message bot-message">
                    <div class="message-content">
                        <strong>Книжный Бот:</strong> Добро пожаловать! Я помогу вам найти интересные книги. 
                        Вы можете спросить меня о книгах по жанру, автору или просто рассказать, что вам нравится.
                    </div>
                </div>
                <div class="suggestions">
                    <h4>Примеры запросов:</h4>
                    <div class="suggestion-chips">
                        <button class="suggestion-chip" data-query="Рекомендуй книги в жанре фэнтези">
                            Рекомендуй книги в жанре фэнтези
                        </button>
                        <button class="suggestion-chip" data-query="Какие книги похожи на Гарри Поттера?">
                            Какие книги похожи на Гарри Поттера?
                        </button>
                        <button class="suggestion-chip" data-query="Посоветуй что-то легкое для чтения">
                            Посоветуй что-то легкое для чтения
                        </button>
                        <button class="suggestion-chip" data-query="Книги про любовь с хорошим концом">
                            Книги про любовь с хорошим концом
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Обновить обработчики для кнопок предложений
        updateSuggestionHandlers();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
    registerForm.addEventListener('submit', (e) => { e.preventDefault(); handleRegister(); });
    // Переключение между формами входа и регистрации
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });
    
    // Кнопка входа
    loginBtn.addEventListener('click', handleLogin);
    
    // Кнопка регистрации
    registerBtn.addEventListener('click', handleRegister);
    
    // Кнопка выхода
    logoutBtn.addEventListener('click', handleLogout);
    
    // Отправка сообщения по Enter
    messageInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Кнопка отправки сообщения
    sendBtn.addEventListener('click', sendMessage);
    
    // Кнопка нового чата
    newChatBtn.addEventListener('click', startNewChat);
    
    // Кнопка очистки истории
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    
    // Обновить обработчики для быстрых предложений
    updateSuggestionHandlers();
    
    // Голосовой ввод
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }
}

// Обновление обработчиков для кнопок предложений
function updateSuggestionHandlers() {
    document.querySelectorAll('.suggestion-chip').forEach(button => {
        // Удаляем старые обработчики
        button.replaceWith(button.cloneNode(true));
    });
    
    // Добавляем новые обработчики
    document.querySelectorAll('.suggestion-chip').forEach(button => {
        button.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            messageInput.value = query;
            sendMessage();
        });
    });
}

// Обработка входа
async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Валидация
    if (!username || !password) {
        showError('login-password-error', 'Заполните все поля');
        return;
    }
    
    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        
        await login(username, password);
        
        // Очистка полей
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        
        // Показать страницу чата
        showChatPage();
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        showError('login-password-error', error.message || 'Ошибка входа');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
    }
}

// Обработка регистрации
async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Валидация
    if (!username || !email || !password || !passwordConfirm) {
        showError('register-password-error', 'Заполните все поля');
        return;
    }
    
    if (password !== passwordConfirm) {
        showError('register-password-confirm-error', 'Пароли не совпадают');
        return;
    }
    
    if (password.length < 6) {
        showError('register-password-error', 'Пароль должен быть не менее 6 символов');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('register-email-error', 'Введите корректный email');
        return;
    }
    
    try {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
        
        await register(username, email, password);
        
        // Автоматический вход после регистрации
        await login(username, password);
        
        // Очистка полей
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-password-confirm').value = '';
        
        // Показать страницу чата
        showChatPage();
        
        // Показать сообщение об успешной регистрации
        addMessage("Добро пожаловать! Вы успешно зарегистрировались. Я готов помочь вам найти интересные книги. Чем могу помочь?", false);
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showError('register-password-error', error.message || 'Ошибка регистрации');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Зарегистрироваться';
    }
}

// Функция входа
async function login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Неверные учетные данные');
        }
        
        const data = await response.json();
        accessToken = data.access_token;
        
        // Сохраняем токен в localStorage
        localStorage.setItem('access_token', accessToken);
        
        // Получаем информацию о пользователе
        const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (userResponse.ok) {
            currentUser = await userResponse.json();
            updateUserInterface();
        }
        
    } catch (error) {
        throw error;
    }
}

// Функция регистрации
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Ошибка регистрации');
        }
        
        return await response.json();
        
    } catch (error) {
        throw error;
    }
}

// Проверка авторизации и загрузка пользователя
async function checkAuthAndLoadUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showChatPage();
            updateUserInterface();
        } else {
            // Если токен невалидный, разлогиниваем
            localStorage.removeItem('access_token');
            accessToken = null;
            showAuthPage();
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showAuthPage();
    }
}

// Обновление интерфейса пользователя
function updateUserInterface() {
    if (currentUser) {
        currentUsernameSpan.textContent = currentUser.username;
        document.getElementById('book-count').textContent = currentUser.books_read || 0;
        document.getElementById('message-count').textContent = currentUser.messages_sent || 0;
    }
}

// Обработка выхода
function handleLogout() {
    localStorage.removeItem('access_token');
    accessToken = null;
    currentUser = null;
    showAuthPage();
    
    // Очистка чата
    initWelcomeMessage();
    
    // Очистка рекомендаций
    recommendationsList.innerHTML = `
        <div class="empty-recommendations">
            <i class="fas fa-book-open"></i>
            <p>Здесь появятся рекомендации книг</p>
        </div>
    `;
}

// Отправка сообщения
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    // Добавляем сообщение пользователя в чат
    addMessage(message, true);
    messageInput.value = '';
    
    // Отправляем сообщение на API
    try {
        await sendMessageToApi(message);
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        addMessage("Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.", false);
    }
}

// Отправка сообщения на API
async function sendMessageToApi(message) {
    try {
        isTyping = true;
        showTypingIndicator();
        
        const response = await fetch(`${API_BASE_URL}/chat/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                message: message,
                chat_id: currentChatId
            })
        });
        
        hideTypingIndicator();
        isTyping = false;
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
        }
        
        const data = await response.json();
        addMessage(data.response, false);
        
        if (data.recommendations && data.recommendations.length > 0) {
            // Очищаем старые рекомендации
            recommendationsList.innerHTML = '';
            data.recommendations.forEach(book => {
                addBookSuggestion(book);
            });
        }
        
        // Обновляем счетчик сообщений
        document.getElementById('message-count').textContent = 
            parseInt(document.getElementById('message-count').textContent) + 1;
        
    } catch (error) {
        hideTypingIndicator();
        isTyping = false;
        console.error('Ошибка при отправке сообщения:', error);
        addMessage(error.message || "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.", false);
    }
}

// Добавление сообщения в чат
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
        </div>
        <div class="message-content">
            <div class="message-header">
                <strong>${isUser ? 'Вы' : 'Книжный Бот'}</strong>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-text">${escapeHtml(text)}</div>
        </div>
    `;
    
    // Удаляем приветственное сообщение при первом сообщении пользователя
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage && isUser) {
        welcomeMessage.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Добавление рекомендации книги
function addBookSuggestion(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book-recommendation';
    bookElement.innerHTML = `
        <div class="book-cover">
            <i class="fas fa-book"></i>
        </div>
        <div class="book-info">
            <h4>${escapeHtml(book.title)}</h4>
            <p class="book-author">${escapeHtml(book.author)}</p>
            <p class="book-genre">${book.genre}</p>
            <div class="book-rating">
                ${getRatingStars(book.rating || 4)}
                <span>${book.rating || 4}/5</span>
            </div>
            <button class="btn-book-details" data-book-id="${book.id}">
                <i class="fas fa-info-circle"></i> Подробнее
            </button>
        </div>
    `;
    
    recommendationsList.appendChild(bookElement);
    
    // Обработчик для кнопки подробнее
    bookElement.querySelector('.btn-book-details').addEventListener('click', function() {
        showBookDetails(book);
    });
}

// Показать детали книги
function showBookDetails(book) {
    const modal = document.getElementById('book-modal');
    const modalContent = document.getElementById('book-modal-content');
    
    modalContent.innerHTML = `
        <div class="book-details">
            <div class="book-details-header">
                <h2>${escapeHtml(book.title)}</h2>
                <p class="book-details-author">${escapeHtml(book.author)}</p>
            </div>
            <div class="book-details-body">
                <div class="book-details-cover">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="book-details-info">
                    <p><strong>Жанр:</strong> ${book.genre}</p>
                    <p><strong>Рейтинг:</strong> ${getRatingStars(book.rating || 4)} ${book.rating || 4}/5</p>
                    <p><strong>Год:</strong> ${book.year || 'Не указан'}</p>
                    <p><strong>Страниц:</strong> ${book.pages || 'Не указано'}</p>
                    <div class="book-description">
                        <h4>Описание:</h4>
                        <p>${book.description || 'Описание отсутствует.'}</p>
                    </div>
                </div>
            </div>
            <div class="book-details-footer">
                               <button class="btn-primary" id="add-to-favorites">
                    <i class="fas fa-heart"></i> Добавить в избранное
                </button>
                <button class="btn-secondary" id="find-similar">
                    <i class="fas fa-search"></i> Найти похожие
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Обработчики для кнопок в модальном окне
    document.getElementById('add-to-favorites').addEventListener('click', function() {
        addToFavorites(book.id);
    });
    
    document.getElementById('find-similar').addEventListener('click', function() {
        findSimilarBooks(book.title);
    });
    
    // Закрытие модального окна
    document.querySelector('.close-modal').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// Вспомогательные функции
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Автоматически скрыть ошибку через 5 секунд
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Загрузка истории чатов
async function loadChatHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/chats`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const chats = await response.json();
            displayChatHistory(chats);
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

// Отображение истории чатов
function displayChatHistory(chats) {
    chatHistory.innerHTML = '';
    
    if (chats.length === 0) {
        chatHistory.innerHTML = '<p class="no-chats">Нет сохраненных чатов</p>';
        return;
    }
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        chatItem.innerHTML = `
            <div class="chat-history-preview">
                <strong>${chat.title || 'Новый чат'}</strong>
                <span class="chat-history-time">${new Date(chat.created_at).toLocaleDateString()}</span>
            </div>
            <p class="chat-history-last-message">${chat.last_message || 'Нет сообщений'}</p>
        `;
        
        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatHistory.appendChild(chatItem);
    });
}

// Загрузка конкретного чата
async function loadChat(chatId) {
    currentChatId = chatId;
    try {
        const response = await fetch(`${API_BASE_URL}/chat/chats/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const chatData = await response.json();
            // Загрузить сообщения чата
            loadChatMessages(chatData.messages);
        }
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
    }
}

// Загрузка сообщений чата
function loadChatMessages(messages) {
    messagesContainer.innerHTML = '';
    recommendationsList.innerHTML = `
        <div class="empty-recommendations">
            <i class="fas fa-book-open"></i>
            <p>Здесь появятся рекомендации книг</p>
        </div>
    `;
    
    messages.forEach(msg => addMessage(msg.content, msg.role === 'user'));
}

// Начать новый чат
function startNewChat() {
    if (isTyping) return;
    
    currentChatId = null;
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="message bot-message">
                <div class="message-content">
                    <strong>Книжный Бот:</strong> Начнем новый диалог! Чем могу помочь?
                </div>
            </div>
        </div>
    `;
    recommendationsList.innerHTML = `
        <div class="empty-recommendations">
            <i class="fas fa-book-open"></i>
            <p>Здесь появятся рекомендации книг</p>
        </div>
    `;
    
    updateSuggestionHandlers();
}

// Очистка истории чатов
async function clearChatHistory() {
    if (confirm('Вы уверены, что хотите очистить всю историю чатов?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/chats/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                chatHistory.innerHTML = '<p class="no-chats">Нет сохраненных чатов</p>';
                startNewChat();
            }
        } catch (error) {
            console.error('Ошибка очистки истории:', error);
            alert('Ошибка при очистке истории чатов');
        }
    }
}

// Голосовой ввод
function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.start();
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
        };
        
        recognition.onerror = function(event) {
            console.error('Ошибка распознавания речи:', event.error);
            alert('Ошибка распознавания речи. Пожалуйста, проверьте микрофон и разрешения.');
        };
        
        recognition.onspeechend = function() {
            recognition.stop();
        };
    } else {
        alert('Ваш браузер не поддерживает голосовой ввод');
    }
}

// Добавить в избранное
async function addToFavorites(book) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                id: book.id,
                title: book.title,
                author: book.author,
                cover_url: book.cover_url
            })
        });
        
        if (response.ok) {
            alert('Книга добавлена в избранное!');
        } else {
            alert('Ошибка при добавлении в избранное');
        }
    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        alert('Ошибка при добавлении в избранное');
    }
}

// Найти похожие книги
function findSimilarBooks(bookTitle) {
    messageInput.value = `Найди книги похожие на "${bookTitle}"`;
    sendMessage();
    document.getElementById('book-modal').style.display = 'none';
}