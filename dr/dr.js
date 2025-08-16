document.addEventListener('DOMContentLoaded', function () {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = savedTheme;
  const galleryEl = document.getElementById('gallery');
  const detailOverlay = document.getElementById('detail-overlay');
  const imageOverlay = document.getElementById('image-overlay');
  const detailTitle = document.getElementById('detail-title');
  const carouselWrapper = document.getElementById('carousel-wrapper');
  const dotIndicator = document.getElementById('dot-indicator');
  const detailDesc = document.getElementById('detail-desc');
  const detailTags = document.getElementById('detail-tags');
  const homeButton = document.querySelector('.home-button');
  const priceButton = document.getElementById('priceButton');
  const headerTitle = document.getElementById('headerTitle');
  const searchControl = document.getElementById('searchControl');
  const searchIcon = document.getElementById('searchIcon');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  let photoData = [];
  let filteredData = [];
  let currentCardIndex = -1;
  let carouselCurrentIndex = 0;
  let isDragging = false;
  let startX = 0;
  const HIDDEN_CARD_IMAGE_URL = 'https://img.fastmirror.net/s/2025/08/17/68a0d5c6d5d92.png';
  const urlParams = new URLSearchParams(window.location.search);
  const isProMode = urlParams.get('pro') === 'y';

  async function loadPhotoData() {
    try {
      const response = await fetch('dr.json');
      photoData = await response.json();
      filteredData = [...photoData];
      renderGallery();
    } catch (error) {
      console.error('数据加载失败:', error);
      galleryEl.innerHTML = '<p class="error">图册加载失败，请刷新页面</p>';
    }
  }

  function renderGallery() {
    galleryEl.innerHTML = '';
    filteredData.forEach((card, index) => {
      let cardEl;
      if (!isProMode && card.tags && card.tags.includes("no")) {
        cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
          <img class="card-img" src="${HIDDEN_CARD_IMAGE_URL}" alt="已隐藏" loading="lazy">
          <div class="card-content">
            <div class="card-header">
              <div class="card-title">[・_・?]</div>
            </div>
            <div class="card-desc">此卡片已隐藏</div>
            <div class="card-tags">
              <span class="card-tag">无</span>
            </div>
          </div>
        `;
        cardEl.addEventListener('click', () => {
             alert('此卡片已被隐藏，无法查看详情，可能是授权/图片异常等原因');
        });
      } else {
        const firstLineDesc = card.desc.split('\n')[0];
        cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
          <img class="card-img" src="${card.images[0]}" alt="${card.title}" loading="lazy">
          <div class="card-content">
            <div class="card-header">
              <div class="card-title">${card.title}</div>
            </div>
            <div class="card-desc">${firstLineDesc}</div>
            <div class="card-tags">
              ${card.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
          </div>
        `;
        cardEl.addEventListener('click', () => openDetail(index));
      }
      galleryEl.appendChild(cardEl);
    });
  }

  function openSearch() {
    searchControl.classList.add('active');
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  }

  function closeSearch() {
    searchControl.classList.remove('active');
    searchInput.value = '';
    filteredData = [...photoData];
    renderGallery();
  }

  function searchPhotos() {
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) return;
    filteredData = photoData.filter(card =>
      card.title.toLowerCase().includes(keyword) ||
      card.desc.toLowerCase().includes(keyword) ||
      card.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
    renderGallery();
    if (filteredData.length === 0) {
      alert("什么都没找到捏…");
      closeSearch();
    }
  }

  function openDetail(index) {
    if (!isProMode) {
      const card = filteredData[index];
      if (card.tags && card.tags.includes("忽略")) {
        alert('此卡片已被隐藏，可能是授权/图片异常等原因');
        return;
      }
    }

    currentCardIndex = index;
    const card = filteredData[index];
    detailTitle.textContent = card.title;
    detailDesc.innerHTML = card.desc.replace(/\n/g, '<br>');
    detailTags.innerHTML = card.tags.map(tag =>
      `<span class="detail-tag">${tag}</span>`
    ).join('');
    carouselWrapper.innerHTML = '';
    dotIndicator.innerHTML = '';
    card.images.forEach((img, i) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      item.innerHTML = `<img src="${img}" class="carousel-img" data-index="${i}">`;
      carouselWrapper.appendChild(item);
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i;
      dotIndicator.appendChild(dot);
    });
    document.querySelectorAll('.carousel-img').forEach(img => {
      img.addEventListener('click', (e) => {
        openImageOverlay(e.target.src);
      });
    });
    document.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        slideTo(parseInt(e.target.dataset.index));
      });
    });
    carouselWrapper.addEventListener('wheel', handleCarouselWheel);
    carouselWrapper.addEventListener('mousedown', handleDragStart);
    carouselWrapper.addEventListener('touchstart', handleDragStart);
    detailOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    slideTo(0);
  }

  function handleCarouselWheel(e) {
    e.preventDefault();
    if (e.deltaY > 0) {
      slideToNext();
    } else {
      slideToPrev();
    }
  }

  function slideTo(index) {
    const total = filteredData[currentCardIndex].images.length;
    index = (index + total) % total;
    carouselWrapper.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    carouselCurrentIndex = index;
  }

  function handleDragStart(e) {
    isDragging = true;
    startX = e.clientX || e.touches[0].clientX;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
  }

  function handleDragMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX || e.touches[0].clientX;
    const diffX = startX - currentX;
    if (Math.abs(diffX) > 50) {
      diffX > 0 ? slideToNext() : slideToPrev();
      handleDragEnd();
    }
  }

  function handleDragEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  }

  function slideToNext() { slideTo(carouselCurrentIndex + 1); }
  function slideToPrev() { slideTo(carouselCurrentIndex - 1); }

  function openImageOverlay(src) {
    imageOverlay.querySelector('img').src = src;
    imageOverlay.classList.add('active');
  }

  searchIcon.addEventListener('click', openSearch);
  searchClose.addEventListener('click', closeSearch);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchPhotos();
  });
  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) {
      carouselWrapper.removeEventListener('wheel', handleCarouselWheel);
      detailOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
  imageOverlay.addEventListener('click', () => {
    imageOverlay.classList.remove('active');
  });
  homeButton.addEventListener('click', () => {
    if (history.length > 1) {
      const fallbackTimer = setTimeout(() => {
        location.href = "/";
      }, 300);
      window.history.back();
      window.addEventListener('popstate', function handlePop() {
        clearTimeout(fallbackTimer);
        window.removeEventListener('popstate', handlePop);
      }, { once: true });
    } else {
      location.href = "/";
    }
  });
  loadPhotoData();
});
