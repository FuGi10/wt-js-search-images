import apiService from './api';
import { lightbox } from './lightbox';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

const searchButton = document.getElementById('search-button');
const galleryContainer = document.querySelector('.gallery');
const searchQueryInput = document.getElementById('search-bar');
const paginationContainer = document.getElementById('pagination-container')
const paginationButtons = document.getElementById('pagination-numbers');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

let isShown = 0;
let isFirstSearch = true;
let currentPage = 1;
let query = ''

searchButton.addEventListener("click", function(event) {  
  event.preventDefault();
  onSearch();
  isFirstSearch = true;
  currentPage = 1;
});

searchQueryInput.addEventListener("keydown", function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    onSearch();
  }
  isFirstSearch = true; 
  currentPage = 1;
});

prevButton.addEventListener('click', () => setCurrentPage(currentPage - 1));
nextButton.addEventListener('click', () => setCurrentPage(currentPage + 1));

async function onSearch() {
  const searchQuery = searchQueryInput.value.trim();
  
  apiService.setQuery(searchQuery); 

  if (searchQuery === '') {
    showToast('warning', 'Будь ласка, заповніть поле пошуку');
    paginationContainer.classList.add('is-hidden')
    return;
  }

  if (searchQuery === query) {    
    showToast('warning', 'Будь ласка, змініть або введіть нове значення для пошуку.');
    return;
  }  
  
  apiService.resetPage();  
  query = searchQuery;
  isShown = 0;
  await fetchGallery(1);
}

async function fetchGallery(currentPage) {
  try {    
    apiService.getPage(currentPage)
    const result = await apiService.fetchGallery();    
    const { hits, totalHits } = result;

    if (isFirstSearch && !hits.length) {
      showToast('error', 'Вибачте, немає зображень, які відповідають вашому пошуковому запиту. Будь ласка спробуйте ще раз.');
      paginationContainer.classList.add('is-hidden')
      return;
    }

    if (isFirstSearch && isShown < totalHits) {
      showToast('success', `Ура! Ми знайшли ${totalHits} зображень!`);
      setupPagination({ hits, totalHits });
      isFirstSearch = false;      
    }

    galleryContainer.innerHTML = '';
    onRenderGallery(hits);    
    isShown += hits.length;

    if (isFirstSearch && isShown >= totalHits) {
      showToast('info', "Ви досягли кінця результатів пошуку.");      
    }
  } catch (error) {
    console.error('Error fetching gallery:', error);
    showToast('error', 'Під час отримання галереї зображень сталася помилка.');
  }
}

function onRenderGallery(elements) {
  const markup = elements
    .map(({ webformatURL, largeImageURL, tags, likes, views, downloads }) => `
      <div class="photo-card">
        <a href="${largeImageURL}">
          <img class="photo-img" src="${webformatURL}" alt="${tags}" loading="lazy" />
        </a>
        <div class="info">
          <p class="info-item"><b>Вподобайки</b><span class="info__span">${likes}</span></p>
          <p class="info-item"><b>Перегляди</b><span class="info__span">${views}</span></p>
          <p class="info-item"><b>Завантаження</b><span class="info__span">${downloads}</span></p>
        </div>
      </div>`
    )
    .join('');

  galleryContainer.insertAdjacentHTML('beforeend', markup);
  lightbox.refresh();
}

function setupPagination({ hits, totalHits }) {
  
  const pageCount = Math.ceil(totalHits / hits.length); 
  
  paginationButtons.innerHTML = '';

  for (let i = 1; i <= pageCount; i++) {
    const pageNumber = document.createElement('button');
    pageNumber.className = 'pagination-number';
    pageNumber.textContent = i;

    paginationButtons.appendChild(pageNumber);

    pageCount > 1 ? paginationContainer.classList.remove('is-hidden') : paginationContainer.classList.add('is-hidden')

    pageNumber.addEventListener('click', () => {
      setCurrentPage(i);
      isFirstSearch = false; 
    });    
  }
  handlePageButtonsStatus();
  handleActivePageNumber();  
}

async function setCurrentPage(i) {
  currentPage = i; 
  await fetchGallery(currentPage);
  scrollToTop();
  handlePageButtonsStatus();
  handleActivePageNumber();  
}

const disableButton = (button) => {
  button.classList.add("disabled");
  button.setAttribute("disabled", true);
};

const enableButton = (button) => {
  button.classList.remove("disabled");
  button.removeAttribute("disabled");
};

const handlePageButtonsStatus = () => {  
  if (currentPage === 1) {
    disableButton(prevButton);
  } else {
    enableButton(prevButton);
  }

  if (currentPage === paginationButtons.children.length) {
    disableButton(nextButton);
  } else {
    enableButton(nextButton);
  }
};

const handleActivePageNumber = () => {  
  document.querySelectorAll(".pagination-number").forEach((button, page) => {
    button.classList.remove("active");    
    if (page + 1 === currentPage) {
      button.classList.add("active");
    }
  });
};

function showToast(type, message) {
  iziToast[type]({
    title: type.charAt(0).toUpperCase() + type.slice(1),
    message: message,
    position: 'topRight',
    color: type === 'success' ? 'green' : type === 'warning' ? 'yellow' : type === 'error' ? 'red' : 'blue',
    timeout: 2000,
    closeOnEscape: true,
    closeOnClick: true,
  });
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'auto',
  });
} 
