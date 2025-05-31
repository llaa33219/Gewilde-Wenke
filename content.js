// URL과 페이지 상태를 추적하는 변수들
let currentUrl = window.location.href;
let isProcessing = false;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY = 500; // 500ms
const MAX_HOT_TIPS = 3; // 최대 인기 팁 개수
let observer = null; // MutationObserver 인스턴스를 저장

async function main() {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
        console.log("Main function is already processing, skipping...");
        return;
    }
    
    isProcessing = true;
    retryCount = 0;
    
    console.log("PlayEntry Hot Tips: Starting main function...");
    
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenElement) {
        console.error("CSRF token not found");
        isProcessing = false;
        return;
    }
    const csrfToken = csrfTokenElement.getAttribute('content');

    if (!csrfToken) {
        console.error("CSRF token content is empty");
        isProcessing = false;
        return;
    }

    // Helper function to strip HTML tags from a string
    function stripHtml(htmlString) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || "";
    }

    // Helper function to extract images from HTML content
    function extractImagesFromContent(htmlContent) {
        if (!htmlContent) return [];
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const images = tempDiv.querySelectorAll('img');
        return Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt || ""
        }));
    }

    try {
        chrome.runtime.sendMessage(
            { action: "fetchPlayEntryData", csrfToken: csrfToken },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to background script:", chrome.runtime.lastError.message);
                    isProcessing = false;
                    return;
                }
                if (!response) {
                    console.error("Received no response from background script.");
                    isProcessing = false;
                    return;
                }

                if (response.success && response.data) {
                    const data = response.data;
                    if (data.errors) {
                        console.error("GraphQL query errors:", data.errors);
                        isProcessing = false;
                        return;
                    }

                    const discussList = data.data.discussList;
                    if (!discussList || !discussList.list) {
                        console.error("Discuss list not found in GraphQL response");
                        isProcessing = false;
                        return;
                    }

                    const popularPosts = discussList.list.filter(post => post.likesLength >= 20).slice(0, MAX_HOT_TIPS);

                    if (popularPosts.length === 0) {
                        console.log("No posts found with 20+ likes.");
                        isProcessing = false;
                        return;
                    }

                    const targetElement = document.querySelector('.css-kxk8de.e1u0qwgu0');
                    if (!targetElement) {
                        console.error("Target element '.css-kxk8de.e1u0qwgu0' not found. Content script might have run too early or element is missing.");
                        isProcessing = false;
                        return;
                    }

                    // Create header
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'playentry-hot-tips-header';
                    headerDiv.textContent = '인기 노하우&팁';

                    // Create list container matching original style
                    const listContainer = document.createElement('ul');
                    listContainer.className = 'css-9k9fe2 e1u0qwgu2 playentry-hot-tips-container';
                    listContainer.setAttribute('data-playentry-hot-tips', 'true');
                    listContainer.style.marginBottom = '20px';
                    listContainer.style.display = 'flex';
                    listContainer.style.gap = '15px';
                    listContainer.style.flexWrap = 'wrap';
                    listContainer.style.alignItems = 'flex-start';
                    listContainer.style.paddingBottom = '15px';
                    listContainer.style.borderBottom = '1px solid #ddd';

                    popularPosts.forEach((post, index) => {
                        const listItem = document.createElement('li');
                        listItem.className = "active css-1xk0vcr ee00u800 playentry-hot-tips-item";

                        const link = document.createElement('a');
                        link.href = `/community/tips/${post.id}`;

                        const titleStrong = document.createElement('strong');
                        titleStrong.textContent = post.title;

                        const authorSpan = document.createElement('span');
                        authorSpan.className = "css-13nge8u ee00u803";
                        authorSpan.textContent = post.user.nickname;

                        const textInnerDiv = document.createElement('div');
                        textInnerDiv.className = "textInner";

                        const seViewerDiv = document.createElement('div');
                        seViewerDiv.className = "se-viewer se-theme-default";
                        seViewerDiv.setAttribute("lang", "ko-KR");

                        // Add SE_DOC_HEADER comments
                        const headerComment1 = document.createComment(' SE_DOC_HEADER_START ');
                        const headerComment2 = document.createComment('@CONTENTS_HEADER');
                        const headerComment3 = document.createComment(' SE_DOC_HEADER_END ');
                        seViewerDiv.appendChild(headerComment1);
                        seViewerDiv.appendChild(headerComment2);
                        seViewerDiv.appendChild(headerComment3);

                        const seMainContainer = document.createElement('div');
                        seMainContainer.className = "se-main-container";

                        // Use seContent if available, otherwise use content
                        const contentToUse = post.seContent || post.content || "";
                        console.log(`Post ${index} (ID: ${post.id}) seContent:`, post.seContent);
                        console.log(`Post ${index} (ID: ${post.id}) content:`, post.content);

                        // Extract images from content
                        const contentImages = extractImagesFromContent(contentToUse);
                        console.log(`Post ${index} (ID: ${post.id}) extracted images:`, contentImages);

                        // Add first image if exists
                        if (contentImages.length > 0) {
                            const firstImage = contentImages[0];
                            
                            const imageComponent = document.createElement('div');
                            imageComponent.className = "se-component se-image se-l-default";
                            imageComponent.id = `SE-${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`;

                            const imageComponentContent = document.createElement('div');
                            imageComponentContent.className = "se-component-content se-component-content-normal";

                            const imageSection = document.createElement('div');
                            imageSection.className = "se-section se-section-image se-l-default se-section-align-";
                            imageSection.style.maxWidth = "300px";

                            const imageModule = document.createElement('div');
                            imageModule.className = "se-module se-module-image";

                            const imageLink = document.createElement('a');
                            imageLink.href = "#";
                            imageLink.className = "se-module-image-link __se_image_link __se_link";
                            imageLink.onclick = function() { return false; };
                            imageLink.setAttribute('data-linktype', 'img');

                            const img = document.createElement('img');
                            img.src = firstImage.src;
                            img.alt = firstImage.alt;
                            img.className = "se-image-resource";

                            imageLink.appendChild(img);
                            imageModule.appendChild(imageLink);
                            imageSection.appendChild(imageModule);
                            imageComponentContent.appendChild(imageSection);
                            imageComponent.appendChild(imageComponentContent);

                            // Add script tag for image module data
                            const imageScriptTag = document.createElement('script');
                            imageScriptTag.type = 'text/data';
                            imageScriptTag.className = '__se_module_data';
                            imageScriptTag.setAttribute('data-module-v2', `{"type": "v2_image", "id": "${imageComponent.id}", "data": {"ctype": "image", "ai": "false"}}`);
                            imageComponent.appendChild(imageScriptTag);

                            seMainContainer.appendChild(imageComponent);
                        }

                        // Create se-component se-text structure
                        const seComponent = document.createElement('div');
                        seComponent.className = "se-component se-text se-l-default";
                        seComponent.id = `SE-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`;

                        const seComponentContent = document.createElement('div');
                        seComponentContent.className = "se-component-content";

                        const seSection = document.createElement('div');
                        seSection.className = "se-section se-section-text se-l-default";

                        const seModuleText = document.createElement('div');
                        seModuleText.className = "se-module se-module-text";

                        // Add SE-TEXT comment
                        const seTextComment1 = document.createComment(' SE-TEXT { ');
                        seModuleText.appendChild(seTextComment1);

                        const pElement = document.createElement('p');
                        pElement.className = "se-text-paragraph se-text-paragraph-align-";
                        pElement.style = "";
                        pElement.id = `SE-${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`;
                        
                        const textFromApiContent = stripHtml(contentToUse).trim();
                        console.log(`Post ${index} (ID: ${post.id}) textFromApiContent (stripped and trimmed):`, textFromApiContent);
                        
                        let snippet = "";
                        const maxSnippetLength = 150;

                        if (textFromApiContent.length > 0) {
                            if (textFromApiContent.length > maxSnippetLength) {
                                snippet = textFromApiContent.substring(0, maxSnippetLength) + "...";
                            } else {
                                snippet = textFromApiContent;
                            }
                        } else if (post.title && post.title.trim().length > 0) {
                            let trimmedTitle = post.title.trim();
                            if (trimmedTitle.length > maxSnippetLength) {
                                snippet = trimmedTitle.substring(0, maxSnippetLength) + "...";
                            } else {
                                snippet = trimmedTitle;
                            }
                        } else {
                            snippet = "(내용 요약 없음)";
                        }
                        console.log(`Post ${index} (ID: ${post.id}) final snippet:`, snippet);

                        const spanElement = document.createElement('span');
                        spanElement.style = "";
                        spanElement.className = "se-fs-fs19 se-ff-";
                        spanElement.id = `SE-${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`;
                        spanElement.textContent = snippet;

                        pElement.appendChild(spanElement);
                        seModuleText.appendChild(pElement);

                        const seTextComment2 = document.createComment(' } SE-TEXT ');
                        seModuleText.appendChild(seTextComment2);

                        seSection.appendChild(seModuleText);
                        seComponentContent.appendChild(seSection);
                        seComponent.appendChild(seComponentContent);

                        // Add script tag for module data
                        const scriptTag = document.createElement('script');
                        scriptTag.type = 'text/data';
                        scriptTag.className = '__se_module_data';
                        scriptTag.setAttribute('data-module-v2', `{"type": "v2_text", "id": "${seComponent.id}", "data": {"ctype": "text"}}`);
                        seComponent.appendChild(scriptTag);

                        seMainContainer.appendChild(seComponent);
                        seViewerDiv.appendChild(seMainContainer);
                        textInnerDiv.appendChild(seViewerDiv);

                        const statsDiv = document.createElement('div');
                        statsDiv.className = "css-1u0wckw ee00u801";

                        const dateSpan = document.createElement('span');
                        const createdDate = new Date(post.created);
                        dateSpan.textContent = `${createdDate.getFullYear().toString().slice(-2)}.${(createdDate.getMonth() + 1).toString().padStart(2, '0')}.${createdDate.getDate().toString().padStart(2, '0')}`;

                        const viewsSpan = document.createElement('span');
                        viewsSpan.textContent = `조회 ${post.visit}`;

                        const likesSpan = document.createElement('span');
                        likesSpan.textContent = `좋아요 ${post.likesLength}`;

                        statsDiv.appendChild(dateSpan);
                        statsDiv.appendChild(viewsSpan);
                        statsDiv.appendChild(likesSpan);

                        const moreEm = document.createElement('em');
                        moreEm.textContent = "더 보기";

                        link.appendChild(titleStrong);
                        link.appendChild(authorSpan);
                        link.appendChild(textInnerDiv);
                        link.appendChild(statsDiv);
                        link.appendChild(moreEm);

                        listItem.appendChild(link);
                        listContainer.appendChild(listItem);
                    });

                    // Clean up existing container if exists
                    const existingContainer = document.querySelector('ul[data-playentry-hot-tips="true"]');
                    if (existingContainer) {
                        existingContainer.remove();
                    }
                    
                    const existingHeader = document.querySelector('div[data-playentry-hot-tips-header="true"]');
                    if (existingHeader) {
                        existingHeader.remove();
                    }

                    // Clean up existing general tips header if exists
                    const existingGeneralHeader = document.querySelector('div[data-playentry-general-tips-header="true"]');
                    if (existingGeneralHeader) {
                        existingGeneralHeader.remove();
                    }

                    // Add identifier to header
                    headerDiv.setAttribute('data-playentry-hot-tips-header', 'true');

                    // Create general tips header
                    const generalHeaderDiv = document.createElement('div');
                    generalHeaderDiv.className = 'playentry-hot-tips-header';
                    generalHeaderDiv.textContent = '일반 노하우&팁';
                    generalHeaderDiv.setAttribute('data-playentry-general-tips-header', 'true');

                    // Insert before target element
                    targetElement.parentNode.insertBefore(headerDiv, targetElement);
                    targetElement.parentNode.insertBefore(listContainer, targetElement);
                    targetElement.parentNode.insertBefore(generalHeaderDiv, targetElement);

                    console.log("Extension applied: Hot tips displayed with proper content parsing and image extraction.");
                    isProcessing = false;
                } else {
                    console.error("Failed to fetch data from background script or received invalid data:", response ? response.error : 'No response');
                    isProcessing = false;
                }
            }
        );
    } catch (error) {
        console.error("Error in PlayEntry Hot Tips content script (outer try-catch):", error);
        isProcessing = false;
    }
}

// URL이 팁 페이지 영역인지 확인하는 함수 (감시 범위)
function isInTipsArea() {
    const url = window.location.href;
    return url.includes('/community/tips/');
}

// 실제로 확장 프로그램을 적용할 조건인지 확인하는 함수
function shouldApplyExtension() {
    const url = window.location.href;
    
    // URL에 기본 패스가 포함되어 있는지 확인
    if (!url.includes('/community/tips/list')) {
        return false;
    }
    
    // URL을 파싱하여 쿼리 파라미터 확인
    try {
        const urlObj = new URL(url);
        const searchParams = urlObj.searchParams;
        
        // query 파라미터가 있으면 확장 프로그램을 적용하지 않음
        if (searchParams.has('query')) {
            return false;
        }
        
        return true;
    } catch (error) {
        // URL 파싱 실패시 기존 방식으로 폴백
        console.warn("URL parsing failed, using fallback method:", error);
        // 폴백에서도 query 파라미터 체크
        if (url.includes('query=')) {
            return false;
        }
        return true;
    }
}

// 확장 프로그램이 이미 추가되었는지 확인하는 함수
function isExtensionAlreadyAdded() {
    return document.querySelector('ul[data-playentry-hot-tips="true"]') !== null;
}

// 대상 요소가 존재하는지 확인하는 함수
function hasTargetElement() {
    return document.querySelector('.css-kxk8de.e1u0qwgu0') !== null;
}

// 메인 체크 함수 - 0.5초마다 실행
function checkAndApply() {
    // 팁 영역이 아니면 아무것도 하지 않음
    if (!isInTipsArea()) {
        return;
    }
    
    // 적용 조건을 만족하지 않으면 기존 요소 제거하고 종료
    if (!shouldApplyExtension()) {
        // 기존에 추가된 요소가 있으면 제거
        const existingContainer = document.querySelector('ul[data-playentry-hot-tips="true"]');
        if (existingContainer) {
            existingContainer.remove();
        }
        const existingHeader = document.querySelector('div[data-playentry-hot-tips-header="true"]');
        if (existingHeader) {
            existingHeader.remove();
        }
        return;
    }
    
    // 이미 추가되었으면 아무것도 하지 않음
    if (isExtensionAlreadyAdded()) {
        return;
    }
    
    // 대상 요소가 없으면 아무것도 하지 않음
    if (!hasTargetElement()) {
        return;
    }
    
    // 모든 조건이 맞으면 확장 프로그램 적용
    console.log("Conditions met, applying hot tips extension...");
    main();
}

// 0.5초마다 체크
setInterval(checkAndApply, 500);

console.log("PlayEntry Hot Tips: Interval checker started (every 500ms)"); 