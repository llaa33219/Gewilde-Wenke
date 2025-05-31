chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchPlayEntryData") {
    const csrfToken = request.csrfToken;
    
    if (!csrfToken) {
      console.error("Background script: No CSRF token provided");
      sendResponse({ success: false, error: "No CSRF token provided" });
      return;
    }

    const graphqlQuery = {
      "query": "\n    query SELECT_DISCUSS_LIST(\n    $pageParam: PageParam\n    $query: String\n    $user: String\n    $category: String\n    $term: String\n    $prefix: String\n    $progress: String\n    $discussType: String\n    $searchType: String\n    $searchAfter: JSON\n    $tag: String\n){\n        discussList(\n    pageParam: $pageParam\n    query: $query\n    user: $user\n    category: $category\n    term: $term\n    prefix: $prefix\n    progress: $progress\n    discussType: $discussType\n    searchType: $searchType\n    searchAfter: $searchAfter\n    tag: $tag\n) {\n            total\n            list {\n                \n    id\n    title\n    content\n    seContent\n    created\n    commentsLength\n    likesLength\n    favorite\n    visit\n    category\n    prefix\n    groupNotice\n    user {\n        \n    id\n    nickname\n    profileImage {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n\n    }\n    status {\n        following\n        follower\n    }\n    description\n    role\n    mark {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n \n    }\n\n    }\n    images {\n        filename\n        imageUrl\n    }\n    sticker {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n\n    }\n    progress\n    thumbnail\n    reply\n    bestComment {\n        \n    id\n    user {\n        \n    id\n    nickname\n    profileImage {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n\n    }\n    status {\n        following\n        follower\n    }\n    description\n    role\n    mark {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n \n    }\n\n    }\n    content\n    created\n    removed\n    blamed\n    blamedBy\n    commentsLength\n    likesLength\n    isLike\n    hide\n    pinned\n    image {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n\n    }\n    sticker {\n        \n    id\n    name\n    label {\n        \n    ko\n    en\n    ja\n    vn\n\n    }\n    filename\n    imageType\n    dimension {\n        \n    width\n    height\n\n    }\n    trimmed {\n        filename\n        width\n        height\n    }\n\n    }\n\n    }\n    blamed\n    description1\n    description2\n    description3\n    tags\n\n            }\n            searchAfter\n        }\n    }\n",
      "variables": { 
        "category": "tips", 
        "searchType": "scroll", 
        "term": "week", 
        "pageParam": { 
          "display": 10, 
          "sort": "likesLength" 
        } 
      }
    };

    fetch("https://playentry.org/graphql/SELECT_DISCUSS_LIST", {
      "headers": {
        "accept": "*/*",
        "accept-language": "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7",
        "content-type": "application/json",
        "csrf-token": csrfToken,
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-type": "Client"
      },
      "referrer": "https://playentry.org/community/tips/list?sort=likesLength&term=week",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": JSON.stringify(graphqlQuery),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    })
    .then(response => {
      console.log(`Background script: Received response with status ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Background script: Successfully fetched PlayEntry data");
      if (data.errors) {
        console.warn("Background script: GraphQL query returned errors:", data.errors);
      }
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error("Background script: Fetch error:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
  // Handle unknown actions
  console.warn("Background script: Unknown action received:", request.action);
  sendResponse({ success: false, error: "Unknown action" });
}); 