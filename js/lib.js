// initialize app structure
let app = {
  fb: {},
  state: {
    cart: null,
    auth: null
  },
  evts: {},
  cart: {},
  cst: {
    API_HOST: "https://j-zone.xyz/api/1.0"
    // https://j-zone.xyz/
  }
};
// core operations
app.get = function(selector) {
  return document.querySelector(selector);
};
app.getAll = function(selector) {
  return document.querySelectorAll(selector);
};

// create Element
app.createElement = function(tagName, settings, parentElement) {
  let obj = document.createElement(tagName);
  if (settings.atrs) {
    app.setAttributes(obj, settings.atrs);
  }
  if (settings.stys) {
    app.setStyles(obj, settings.stys);
  }
  if (settings.evts) {
    app.setEventHandlers(obj, settings.evts);
  }
  if (parentElement instanceof Element) {
    parentElement.appendChild(obj);
  }
  return obj;
};

// modify Element
app.modifyElement = function(obj, settings, parentElement) {
  if (settings.atrs) {
    app.setAttributes(obj, settings.atrs);
  }
  if (settings.stys) {
    app.setStyles(obj, settings.stys);
  }
  if (settings.evts) {
    app.setEventHandlers(obj, settings.evts);
  }
  if (parentElement instanceof Element && parentElement !== obj.parentNode) {
    parentElement.appendChild(obj);
  }
  return obj;
};
app.setStyles = function(obj, styles) {
  for (let name in styles) {
    obj.style[name] = styles[name];
  }
  return obj;
};
app.setAttributes = function(obj, attributes) {
  for (let name in attributes) {
    obj[name] = attributes[name];
  }
  return obj;
};
app.setEventHandlers = function(obj, eventHandlers, useCapture) {
  for (let name in eventHandlers) {
    if (eventHandlers[name] instanceof Array) {
      for (let i = 0; i < eventHandlers[name].length; i++) {
        obj.addEventListener(name, eventHandlers[name][i], useCapture);
      }
    } else {
      obj.addEventListener(name, eventHandlers[name], useCapture);
    }
  }
  return obj;
};

// ajax api
app.ajax = function(method, src, args, headers, callback) {
  let req = new XMLHttpRequest();
  if (method.toLowerCase() === "post") {
    // post through json args
    req.open(method, src);
    req.setRequestHeader("Content-Type", "application/json");
    app.setRequestHeaders(req, headers);
    req.onload = function() {
      callback(this);
    };
    req.send(JSON.stringify(args));
  } else {
    // get through http args
    req.open(method, src + "?" + args);
    app.setRequestHeaders(req, headers);
    req.onload = function() {
      callback(this);
    };
    req.send();
  }
};
app.setRequestHeaders = function(req, headers) {
  for (let key in headers) {
    req.setRequestHeader(key, headers[key]);
  }
};
app.getParameter = function(name) {
  let result = null,
    tmp = [];
  window.location.search
    .substring(1)
    .split("&")
    .forEach(function(item) {
      tmp = item.split("=");
      if (tmp[0] === name) {
        result = decodeURIComponent(tmp[1]);
      }
    });
  return result;
};
// menu items
app.updateMenuItems = function(tag) {
  let desktopItems = app.getAll("header>nav>.item");
  let mobileItems = app.getAll("nav.mobile>.item");
  if (tag === "women") {
    desktopItems[0].classList.add("current");
    mobileItems[0].classList.add("current");
  } else if (tag === "men") {
    desktopItems[1].classList.add("current");
    mobileItems[1].classList.add("current");
  } else if (tag === "accessories") {
    desktopItems[2].classList.add("current");
    mobileItems[2].classList.add("current");
  }
};
// loading
app.showLoading = function() {
  app.get("#loading").style.display = "block";
};
app.closeLoading = function() {
  app.get("#loading").style.display = "none";
};
// facebook login
app.fb.load = function() {
  // Load the SDK asynchronously
  (function(d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/zh_TW/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};
app.fb.init = function() {
  FB.init({
    appId: "306113546764828",
    cookie: true,
    xfbml: true,
    version: "v3.1"
  });
  FB.getLoginStatus(function(response) {
    app.fb.loginStatusChange(response);
    // set member click handlers
    let memberIcons = app.getAll(".member");
    for (let i = 0; i < memberIcons.length; i++) {
      app.setEventHandlers(memberIcons[i], {
        click: app.fb.clickProfile
      });
    }
  });
};
app.fb.login = function() {
  FB.login(
    function(response) {
      app.fb.loginStatusChange(response);
    },
    {
      scope: "public_profile,email"
    }
  );
};
app.fb.loginStatusChange = function(response) {
  if (response.status === "connected") {
    // 這邊是我加上去的By Tofu
    localStorage.setItem("accessToken", response.authResponse.accessToken);
    // let currentUrl = window.location.href;
    // console.log(currentUrl);
    // 讓每一頁都可以顯示大頭貼
    otherPage_profilePic();
    app.state.auth = response.authResponse;
    app.fb.updateLoginToServer();
  } else {
    app.state.auth = null;
  }
  if (typeof app.fb.statusChangeCallback === "function") {
    app.fb.statusChangeCallback();
  }
};
app.fb.updateLoginToServer = function() {
  let data = {
    provider: "facebook",
    access_token: app.state.auth.accessToken
  };
  // signin API
  app.ajax("post", app.cst.API_HOST + "/user/signin", data, {}, function(req) {
    console.log(req.responseText);
    // 這邊是為了要抓到目前登入的ID是誰
    let accountInfo = JSON.parse(req.responseText);
    app.userId = accountInfo.data.user.id;
    console.log(app.userId);
    app.getUser(app.userId);
    // 這邊要有一個function抓收藏API
    app.getUserKeep(app.userId);
    app.getUserProductKeep(app.userId);
    app.getUserOrderList(app.userId);
  });
};

// 寫一個function把ID資料抓出來用 或是可以知道目前登入的ID

app.fb.clickProfile = function() {
  if (app.state.auth === null) {
    app.fb.login();
  } else {
    window.location = "./profile.html";
  }
};
app.fb.getProfile = function() {
  return new Promise((resolve, reject) => {
    FB.api("/me?fields=id,name,email", function(response) {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};
window.fbAsyncInit = app.fb.init;
window.addEventListener("DOMContentLoaded", app.fb.load);
// shopping cart
app.cart.init = function() {
  let storage = window.localStorage;
  let cart = storage.getItem("cart");
  if (cart === null) {
    cart = {
      shipping: "delivery",
      payment: "credit_card",
      recipient: {
        name: "",
        phone: "",
        email: "",
        address: "",
        time: "anytime"
      },
      list: [],
      subtotal: 0,
      freight: 60,
      total: 0
    };
  } else {
    try {
      cart = JSON.parse(cart);
    } catch (e) {
      storage.removeItem("cart");
      app.cart.init();
      return;
    }
  }
  app.state.cart = cart;
  // refresh UIs
  app.cart.show();
};
app.cart.update = function() {
  let storage = window.localStorage;
  let cart = app.state.cart;
  let subtotal = 0;
  for (let i = 0; i < cart.list.length; i++) {
    subtotal += cart.list[i].price * cart.list[i].qty;
  }
  cart.subtotal = subtotal;
  cart.total = cart.subtotal + cart.freight;
  // save to storage
  storage.setItem("cart", JSON.stringify(cart));
  // refresh UIs
  app.cart.show();
};
app.cart.show = function() {
  let cart = app.state.cart;
  app.get("#cart-qty-mobile").textContent = app.get("#cart-qty").textContent =
    cart.list.length;
};
app.cart.add = function(product, variant, qty) {
  let list = app.state.cart.list;
  let color = product.colors.find(item => {
    return item.code === variant.color_code;
  });
  let item = list.find(item => {
    return (
      item.id === product.id &&
      item.size === variant.size &&
      item.color.code === color.code
    );
  });
  if (item) {
    item.qty = qty;
  } else {
    list.push({
      id: product.id,
      title: product.title,
      price: product.price,
      main_image: product.main_image,
      size: variant.size,
      color: color,
      qty: qty,
      stock: variant.stock
    });
  }
  app.cart.update();
  alert("已加入購物車");
};
app.cart.remove = function(index) {
  let list = app.state.cart.list;
  list.splice(index, 1);
  app.cart.update();
  alert("已從購物車中移除");
};
app.cart.change = function(index, qty) {
  let list = app.state.cart.list;
  list[index].qty = qty;
  app.cart.update();
};
app.cart.clear = function() {
  let storage = window.localStorage;
  storage.removeItem("cart");
};

// profile的大頭貼
function otherPage_profilePic() {
  FB.api("/me?fields=id,name,email,picture", function(response) {
    // console.log(response.picture.data.url);
    // console.log(response.picture.data.height);
    // console.log(response.picture.data.width);
    const imgUrl = `https://graph.facebook.com/${
      response.id
    }/picture?width=9999`;
    const loginMember = document.querySelector(".member");
    const loginMemberOrigin = document.querySelector(".member img");
    loginMemberOrigin.style.display = "none";
    loginMember.style.background = `url(${imgUrl}) center no-repeat`;
    loginMember.style.zIndex = 999;
    loginMember.style.borderRadius = "999em";
    loginMember.style.width = "33px";
    loginMember.style.height = "40px";
    loginMember.style.backgroundSize = "contain";
    // mobile version
    const mobileLoginMember = document.querySelector(".feature-mobile .member");
    const mobileLoginMemberOrigin = document.querySelector(
      ".feature-mobile .member img"
    );
    const mobileLoginMemberImg = document.createElement("img");
    mobileLoginMemberOrigin.style.display = "none";
    mobileLoginMemberImg.setAttribute("src", `${imgUrl}`);
    mobileLoginMemberImg.style.zIndex = 999;
    mobileLoginMemberImg.style.borderRadius = "999em";
    mobileLoginMember.insertBefore(
      mobileLoginMemberImg,
      mobileLoginMemberOrigin
    );
  });
}

// 取得User orderList API
app.getUser = function(id) {
  app.ajax(
    "get",
    app.cst.API_HOST + "/user/shipping",
    "uid=" + id,
    {},
    function(req) {
      let data = JSON.parse(req.responseText);
      console.log(req.responseText);
      console.log(data);

      let currentUrl = window.location.href;
      console.log(currentUrl);
      if (currentUrl.includes("profile")) {
        alert("url contains profile");
        // 如果是在profile頁面

        // 填資料
        data.forEach(item => {
          const {
            user_id,
            order_id,
            order_no,
            order_time,
            order_details,
            status
          } = item;
          // 測試可不可以抓到資料
          console.log(user_id);
          console.log(order_id);
          console.log(order_no);
          console.log(order_time);
          console.log(status);
          console.log(order_details);
          console.log(status);
          // createElement--------------------------------------
          const orderListItem = document.createElement("div");
          orderListItem.className = "order_list_items";
          const orderNum = document.createElement("h4");
          orderNum.className = "order_num";
          console.log(`${order_no}`);
          orderNum.innerHTML = "訂單編號" + `${order_no}`;

          // 訂單時間
          let date = order_time;
          date = date.split("/");
          // console.log(date);
          // console.log(date[0]);
          // console.log(date[1]);
          // console.log(date[2]);
          date = date[2] + "/" + date[0] + "/" + date[1];
          const orderTime = document.querySelector("order_time");
          orderTime.innerHTML = "訂單時間：" + `${date}`;

          // 3=完成, 2=待簽收, 1=出貨中, 0=待出貨
          let orderStatus = status;
          const orderStatus_element = document.createElement("p");
          orderStatus_element.className = "order_statusValue";
          if (orderStatus === 3) {
            orderStatus_element.innerHTML = "物流狀態<span>完成訂單</span>";
          } else if (orderStatus === 2) {
            orderStatus_element.innerHTML = "物流狀態<span>待簽收</span>";
          } else if (orderStatus === 1) {
            orderStatus_element.innerHTML = "物流狀態<span>出貨中</span>";
          } else {
            orderStatus_element.innerHTML = "物流狀態<span>待出貨</span>";
          }

          // 查看單筆訂單的按鈕
          // <a href="#" class="orderAList_btn">查看細節</a>
          const orderAList_btn = document.createElement("a");
          orderAList_btn.className = "orderAList_btn";
          orderAList_btn.textContent = "查看細節";
          orderAList_btn.setAttribute("href", `orderlist.html?id=${order_no}`);

          orderListItem.appendChild(orderNum);
          orderListItem.appendChild(orderTime);
          orderListItem.appendChild(orderStatus_element);
          orderListItem.appendChild(orderAList_btn);
          app.get(".order_tab_content").appendChild(orderListItem);
        });
      }
    }
  );
};

// getUserOrderList Alone單一筆購買清單
app.getUserOrderList = function(id) {
  app.ajax(
    "get",
    app.cst.API_HOST + "/user/shipping",
    "uid=" + id,
    {},
    function(req) {
      let data = JSON.parse(req.responseText);
      console.log(req.responseText);
      console.log(data);
      console.log(data);
      let currentUrl = window.location.href;
      if (currentUrl.includes("orderlist")) {
        alert("url contains orderlist");
        // 如果是在orderlist頁面
        let currentUrl_product = new URL(window.location.href);
        console.log(currentUrl_product);
        console.log(currentUrl_product.searchParams.get("id"));
        const currentOrderIDNum = currentUrl_product.searchParams.get("id");
        // 找到訂單編號的意思

        data.forEach(item => {
          const {
            order_no,
            order_time,
            order_details,
            status,
            color,
            main_image
          } = item;
          console.log(order_no);
          let dataOrderNum = order_no;
          if (currentOrderIDNum === dataOrderNum) {
            console.log(dataOrderNum);
            console.log(order_details);
            // 3=完成, 2=待簽收, 1=出貨中, 0=待出貨
            // 這邊改動小車車的位置------------------------
            let orderStatus = status;
            const truckMove = document.querySelector("#lottie");
            console.log(truckMove);
            console.log(orderStatus);
            const statusText = document.querySelector(".shipping_status");
            if (orderStatus === 3) {
              truckMove.style.left = "66%";
              // 出貨狀態
              statusText.innerHTML = "訂單狀態：已完成";
            } else if (orderStatus === 2) {
              truckMove.style.left = "46%";
              // 出貨狀態
              statusText.innerHTML = "訂單狀態：待簽收";
            } else if (orderStatus === 1) {
              truckMove.style.left = "26%";
              // 出貨狀態
              statusText.innerHTML = "訂單狀態：出貨中";
            } else {
              truckMove.style.left = "6%";
              // 出貨狀態
              statusText.innerHTML = "訂單狀態：待出貨";
            }
            // 這邊改動小車車的位置------------------------
            // 訂單時間 組字串
            let date = order_time;
            date = date.split("/");
            date = date[2] + "/" + date[0] + "/" + date[1];
            console.log(`${date}`);

            console.log(order_details.list);
            let orderDetailList = order_details.list;
            // orderList 每筆訂單的內容
            orderDetailList.forEach(item => {
              const { color, id, main_image, price, qty, size, title } = item;
              console.log(color.name);
              console.log(id);
              console.log(main_image);
              console.log(price);
              console.log(qty);
              console.log(size);
              console.log(title);

              console.log(order_details.freight);
              console.log(order_details.total);
              console.log(order_details.payment);
              console.log(order_details.shipping);
              console.log(order_details.subtotal);
              console.log(order_details.recipient.name);
              console.log(order_details.recipient.email);
              console.log(order_details.recipient.time);
              console.log(order_details.recipient.phone);
              console.log(order_details.recipient.address);

              // render createElement
              // 訂單號碼
              const orderlistID = document.querySelector(".order_id");
              orderlistID.innerHTML = "訂單編號：" + `${dataOrderNum}`;
              console.log(`${dataOrderNum}`);
            });
          }
        });
      }
    }
  );
};

// 取得user keep API 收藏清單
app.getUserKeep = function(id) {
  app.ajax("get", app.cst.API_HOST + "/user/keep", "uid=" + id, {}, function(
    req
  ) {
    let currentUrl = window.location.href;
    console.log(currentUrl);
    if (currentUrl.includes("profile.html")) {
      let dataKeep = JSON.parse(req.responseText);
      console.log(dataKeep);
      dataKeep.data.forEach(item => {
        const { id, title, price, main_image } = item;
        console.log(id);
        console.log(title);
        console.log(price);
        console.log(main_image);
        // 歡呼一百次抓到資料了
        // createElement--------------------------------------
        // collection的內容
        // 單一的collect物件
        const collectListItem = document.createElement("div");
        collectListItem.className = "collection_list_items";

        // 圖片
        const collectListImg = document.createElement("div");
        collectListImg.className = "collect_img";
        const collectImg = document.createElement("img");
        collectImg.src = `${main_image}`;
        collectListImg.appendChild(collectImg);

        // 產品title
        // 務必記住ID一個頁面只會有一個
        const collectTitle = document.createElement("h4");
        collectTitle.className = "collection_title";
        collectTitle.innerHTML = `${title}`;

        // 產品ID
        const collectID = document.createElement("p");
        collectID.className = "collection_id";
        collectID.innerHTML = `${id}`;

        // 產品price
        const collectPrice = document.createElement("p");
        collectPrice.className = "collection_price";
        collectPrice.innerHTML = "NT$" + `${price}`;

        // 加上產品連結
        // <a href="#" id="collect_btn">產品細節</a>
        const collect_btn = document.createElement("a");
        collect_btn.className = "collect_btn";
        collect_btn.textContent = "產品細節";
        // 可以連結到收藏的產品頁面
        collect_btn.setAttribute("href", `./product.html?id=${id}`);

        // 刪除按鈕單獨區塊
        const collectDelete = document.createElement("div");
        collectDelete.className = "collect_delete_range";

        // 刪除按鈕
        const collectDelete_btn = document.createElement("a");
        collectDelete_btn.className = "collect_btn_delete";
        collectDelete_btn.setAttribute("href", "#");
        // collectDelete_btn.setAttribute("index", i);

        // 這是remove btn
        collectDelete.appendChild(collectDelete_btn);

        // 右半邊的內容
        const collectRight = document.createElement("div");
        collectRight.className = "right_content";

        // 組在一起
        collectRight.appendChild(collectTitle);
        collectRight.appendChild(collectID);
        collectRight.appendChild(collectPrice);
        collectRight.appendChild(collect_btn);

        // 圖片
        collectListItem.appendChild(collectListImg);
        collectListItem.appendChild(collectRight);
        collectListItem.appendChild(collectDelete);
        app.get(".collection_content").appendChild(collectListItem);
        // i++;
        // console.log(i);
      });
    }
    app.deleteUserProductKeep();
  });
};

// 取得product收藏API
// query網址 https://j-zone.xyz/api/1.0/product/keep?uid=10040&pid=201807202140
app.getUserProductKeep = function(id) {
  let currentUrl = window.location.href;
  console.log(currentUrl);
  if (currentUrl.includes("product.html")) {
    alert("url contains product! 這是產品頁面");
    var productDetailUrl = new URL(window.location.href);
    var params = productDetailUrl.searchParams;
    console.log(productDetailUrl);
    var productID = params.get("id");
    console.log(productID);
    app.ajax(
      "get",
      app.cst.API_HOST + "/product/keep",
      "uid=" + id + "&pid=" + productID,
      {},
      function(req) {
        let data = JSON.parse(req.responseText);
        console.log(data);
        console.log(data.keep);
        // 找出是不是有收藏過
        // if(){}
      }
    );
  }
};

// 在使用者頁面移除收藏
// 畫面的刪除，資料的刪除
app.deleteUserProductKeep = function() {
  const collectDeleteBtn = document.querySelectorAll(".collect_btn_delete");
  for (var i = 0; i < collectDeleteBtn.length; i++) {
    console.log(collectDeleteBtn.length);
    collectDeleteBtn[i].addEventListener("click", e => {
      alert("Hello");
      console.log(e.target.parentElement.parentElement);
      console.log(
        e.target.parentElement.parentElement.children[1].children[1].outerText
      );
      const productID =
        e.target.parentElement.parentElement.children[1].children[1].outerText;
      const aItem = e.target.parentElement.parentElement;
      aItem.remove();
      let requestData = {
        user_id: app.userId,
        product_id: productID,
        keep: false
      };
      console.log(requestData);
      app.ajax(
        "post",
        app.cst.API_HOST + "/user/keep",
        requestData,
        {},
        function(req) {
          let data = JSON.parse(req.responseText);
          console.log(data);
          // 看有沒有post成功
          console.log(keep);
        }
      );
    });
  }
};

// click order 訂單按鈕

// Notification 推播通知 瀏覽器支援度檢查---------------------------------------
// if (!('Notification' in window)) {
// 	console.log('This browser does not support notification');
// }

// // if (Notification.permission === 'default' || Notification.permission === 'undefined') {
// // 	Notification.requestPermission(function (permission) {
// // 		// permission 可為「granted」（同意）、「denied」（拒絕）和「default」（未授權）
// // 		// 在這裡可針對使用者的授權做處理
// // 	});
// // }

// var notifyConfig = {
// 	body: '\\ ^o^ /', // 設定內容
// 	icon: '/images/favicon.ico' // 設定 icon
//   };

//   if (Notification.permission === 'default' || Notification.permission === 'undefined') {
// 	Notification.requestPermission(function (permission) {
// 	  if (permission === 'granted') { // 使用者同意授權
// 		var notification = new Notification('Hi there!', notifyConfig); // 建立通知
// 	  }
// 	});
//   }
// Notification 推播通知 瀏覽器支援度檢查---------------------------------------
