document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    const addBtn = document.getElementById('addBtn');
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');
    const showPagesToggle = document.getElementById('showPagesToggle');
    let pdfDocs = [];
    let rotationAngle = 0;
    const thumbnailWidth = 120;
    let isPagesShown = false;

    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelection);

    addBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 1. Rotate all files and pages
    rotateLeftBtn.addEventListener('click', () => {
        rotationAngle = (rotationAngle - 90) % 360;
        rotateAllItems();
    });

    rotateRightBtn.addEventListener('click', () => {
        rotationAngle = (rotationAngle + 90) % 360;
        rotateAllItems();
    });

    showPagesToggle.addEventListener('change', togglePageDisplay);

    function rotateAllItems() {
        document.querySelectorAll('.pdf-canvas, .file-item').forEach(item => {
            item.style.transform = `rotate(${rotationAngle}deg)`;
        });
    }

    async function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        await processFiles(files);
    }

    async function processFiles(files) {
        showLoader();

        for (let file of files) {
            if (file.type === 'application/pdf') {
                const pdfDoc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                pdfDocs.push({ file, pdfDoc });
                renderPdfCard(file, pdfDoc);
            } else {
                renderFileItem(file);
            }
        }

        hideLoader();
        hideInitialElements();
        initSortable();
    }

    function hideInitialElements() {
        uploadArea.style.display = 'none';
    }

    function renderPdfCard(file, pdfDoc) {
        const fileItem = createFileItem(file.name, pdfDoc.numPages);
        const canvas = createCanvas();
        fileItem.insertBefore(canvas, fileItem.firstChild);
        fileList.appendChild(fileItem);

        pdfDoc.getPage(1).then((page) => {
            renderPage(page, canvas);
        });
    }

    function renderFileItem(file) {
        const fileItem = createFileItem(file.name);
        fileList.appendChild(fileItem);
    }

    function createFileItem(fileName, pageCount) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <p class="file-name" title="${fileName}">${fileName}</p>
            ${pageCount ? `<p class="page-count">${pageCount} Pages</p>` : ''}
            <div class="file-actions">
                <button class="action-btn zoom-btn"><i class="fas fa-search-plus"></i></button>
                <button class="action-btn rotate-btn"><i class="fas fa-redo"></i></button>
                <button class="action-btn duplicate-btn"><i class="fas fa-copy"></i></button>
                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        setupFileItemListeners(fileItem);
        return fileItem;
    }

    function setupFileItemListeners(fileItem) {
        fileItem.querySelector('.zoom-btn').addEventListener('click', () => zoomFile(fileItem));
        fileItem.querySelector('.rotate-btn').addEventListener('click', () => rotateFile(fileItem));
        fileItem.querySelector('.duplicate-btn').addEventListener('click', () => duplicateFile(fileItem));
        fileItem.querySelector('.delete-btn').addEventListener('click', () => deleteFile(fileItem));
    }

    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.classList.add('pdf-canvas');
        return canvas;
    }

    function renderPage(page, canvas, scale = 1) {
        const viewport = page.getViewport({ scale: scale * thumbnailWidth / page.getViewport({ scale: 1 }).width });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const ctx = canvas.getContext('2d');

        page.render({
            canvasContext: ctx,
            viewport: viewport,
        }).promise.then(() => {
            canvas.style.transform = `rotate(${rotationAngle}deg)`;
        });
    }

    // 3. Zoom functionality for individual pages
    function zoomFile(fileItem) {
        const fileName = fileItem.querySelector('.file-name').textContent;
        const modal = createModal(fileName);
        document.body.appendChild(modal);

        const modalContent = modal.querySelector('.modal-content');
        const pdfDoc = pdfDocs.find(doc => doc.file.name === fileName)?.pdfDoc;

        if (pdfDoc) {
            const pageNumber = fileItem.classList.contains('page-item') ? parseInt(fileItem.dataset.pageNumber) : 1;
            const pageCanvas = document.createElement('canvas');
            modalContent.appendChild(pageCanvas);
            pdfDoc.getPage(pageNumber).then(page => renderPage(page, pageCanvas, 2)); // Zoom factor of 2
        }

        addZoomControls(modalContent, pdfDoc);
    }

    // 4. Add control button icons to zoom popup
    function addZoomControls(modalContent, pdfDoc) {
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('modal-controls');
        controlsDiv.innerHTML = `
            <button id="zoomInBtn"><i class="fas fa-search-plus"></i></button>
            <button id="zoomOutBtn"><i class="fas fa-search-minus"></i></button>
            <button id="prevPageBtn"><i class="fas fa-chevron-left"></i></button>
            <button id="nextPageBtn"><i class="fas fa-chevron-right"></i></button>
        `;
        modalContent.appendChild(controlsDiv);

        let currentZoom = 2;
        let currentPage = 1;

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            currentZoom += 0.5;
            updateZoom();
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            currentZoom = Math.max(0.5, currentZoom - 0.5);
            updateZoom();
        });

        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePage();
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            if (pdfDoc && currentPage < pdfDoc.numPages) {
                currentPage++;
                updatePage();
            }
        });

        function updateZoom() {
            const canvas = modalContent.querySelector('canvas');
            if (canvas && pdfDoc) {
                pdfDoc.getPage(currentPage).then(page => renderPage(page, canvas, currentZoom));
            }
        }

        function updatePage() {
            const canvas = modalContent.querySelector('canvas');
            if (canvas && pdfDoc) {
                pdfDoc.getPage(currentPage).then(page => renderPage(page, canvas, currentZoom));
            }
        }
    }

    // ... (previous code remains unchanged) ...

function createModal(fileName) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${fileName}</h2>
            <div class="modal-body">
                <!-- Content will be added here -->
            </div>
            <div class="modal-controls">
                <button id="zoomInBtn"><i class="fas fa-search-plus"></i></button>
                <button id="zoomOutBtn"><i class="fas fa-search-minus"></i></button>
                <button id="prevPageBtn"><i class="fas fa-chevron-left"></i></button>
                <button id="nextPageBtn"><i class="fas fa-chevron-right"></i></button>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;
    modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    return modal;
}

// ... (rest of the code remains unchanged) ...
    function rotateFile(fileItem) {
        const canvas = fileItem.querySelector('.pdf-canvas');
        if (canvas) {
            let rotation = parseInt(canvas.getAttribute('data-rotation') || '0');
            rotation = (rotation + 90) % 360;
            canvas.style.transform = `rotate(${rotation}deg)`;
            canvas.setAttribute('data-rotation', rotation);
        }
    }

    // 2. Duplicate file or page next to the original
    function duplicateFile(fileItem) {
        const clone = fileItem.cloneNode(true);
        setupFileItemListeners(clone);
        fileItem.parentNode.insertBefore(clone, fileItem.nextSibling);
        initSortable(); // Reinitialize sortable to include the new item
    }

    function deleteFile(fileItem) {
        fileItem.remove();
    }

    async function togglePageDisplay() {
        isPagesShown = !isPagesShown;
        if (isPagesShown) {
        fileList.classList.add('show-all-pages');
        await extractAllPagesFromAllPdfFiles();
    } else {
        fileList.classList.remove('show-all-pages');
        renderPdfFilesOnly();
    }
    initSortable(); // Reinitialize sortable after toggling display
    }

    async function extractAllPagesFromAllPdfFiles() {
        fileList.innerHTML = '';
        for (let { pdfDoc, file } of pdfDocs) {
            for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
                await renderPageFromPdf(pdfDoc, file.name, pageNumber);
            }
        }
    }

    async function renderPageFromPdf(pdfDoc, fileName, pageNumber) {
        const fileItem = createFileItem(`${fileName} - Page ${pageNumber}`);
        fileItem.classList.add('page-item');
        fileItem.dataset.pageNumber = pageNumber;
        const canvas = createCanvas();
        fileItem.insertBefore(canvas, fileItem.firstChild);
        fileList.appendChild(fileItem);

        const page = await pdfDoc.getPage(pageNumber);
        renderPage(page, canvas);
    }

    function renderPdfFilesOnly() {
        fileList.innerHTML = '';
        for (let { file, pdfDoc } of pdfDocs) {
            renderPdfCard(file, pdfDoc);
        }
    }

    // 5. Make sure files and pages are draggable and sortable
    function initSortable() {
        new Sortable(fileList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                // Handle the end of sorting if needed
                console.log('Item was moved:', evt.oldIndex, 'to', evt.newIndex);
            }
        });
    }

    function showLoader() {
        const loader = document.createElement('div');
        loader.classList.add('loader');
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    }

    function hideLoader() {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.remove();
        }
    }
});
