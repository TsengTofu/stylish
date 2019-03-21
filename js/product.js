app.state.product = null;
app.state.variant = null;
app.state.qty = 0;
app.init = function () {
	let id = app.getParameter("id");
	if (!id) {
		window.location = "./";
	}
	app.cart.init();
	app.getProduct(id);
	// init event handlers
	// 加入購物車的function
	app.setEventHandlers(app.get("#product-add-cart-btn"), {
		click: function () {
			app.cart.add(app.state.product, app.state.variant, app.state.qty);
		}
	});
	// 加入收藏的btn------------------------------------------------
	// 收藏再點一次就取消
	app.setEventHandlers(app.get("#collection_btn"), {
		click: function () {
			let keepStatus = false;
			if (app.state.keep) {
				app.state.keep = false;
				keepStatus = false;

			} else {
				app.state.keep = true;
				keepStatus = true;
			}

			let requestData = {
				"user_id": app.userId,
				"product_id": id,
				"keep": keepStatus
			}

			app.ajax("post", app.cst.API_HOST + "/user/keep", requestData, {}, function (req) {
				console.log(typeof req.responseText);
				let data = JSON.parse(req.responseText);
				console.log(data);
				if (data.status === "Success") {
					console.log("Success!");
					alert("已加入收藏！")
				}
			});
		}
	});

	// 加入收藏的btn------------------------------------------------
};

app.getProduct = function (id) {
	app.ajax("get", app.cst.API_HOST + "/products/details", "id=" + id, {}, function (req) {
		let data = JSON.parse(req.responseText).data;
		let variant;
		// find first chosen variant available
		for (let key in data.variants) {
			variant = data.variants[key];
			if (variant.stock > 0) {
				app.state.variant = variant;
				break;
			}
		}
		app.state.product = data;
		app.state.qty = 1;
		// update menu item
		app.updateMenuItems(app.state.product.category);
		// show product
		app.showProduct();
	});
};
app.showProduct = function () {
	let product = app.state.product;
	app.get("#product-name").textContent = product.title;
	app.get("#product-id").textContent = product.id;
	app.get("#product-price").textContent = "TWD." + product.price;
	app.get("#product-summary").innerHTML = product.note + "<br/><br/>" + product.texture + "<br/>" + product.description.replace(/\r\n/g, "<br/>") + "<br/><br/>清洗：" + product.wash + "<br/>產地：" + product.place;
	app.createElement("img", {
		atrs: {
			src: product.main_image
		}
	}, app.get("#product-main-image"));
	// colors
	let colorContainer = app.get("#product-colors");
	for (let i = 0; i < product.colors.length; i++) {
		let color = product.colors[i];
		app.createElement("div", {
			atrs: {
				className: "color" + (app.state.variant.color_code === color.code ? " current" : ""),
				value: color
			}, stys: {
				backgroundColor: "#" + color.code
			}, evts: {
				click: app.evts.clickColor
			}
		}, colorContainer);
	}
	// sizes
	let sizeContainer = app.get("#product-sizes");
	product.sizes.forEach((size) => {
		let variant = app.findVariant(app.state.variant.color_code, size);
		let outStock = variant.stock === 0;
		app.createElement("div", {
			atrs: {
				className: "size" + (app.state.variant.size === size ? " current" : "") + (outStock ? " disabled" : ""),
				textContent: size,
				value: size
			}, evts: {
				click: app.evts.clickSize
			}
		}, sizeContainer);
	});
	// qty
	app.get("#product-qty>.value").textContent = app.state.qty;
	let ops = app.getAll("#product-qty>.op");
	ops.forEach((op) => {
		op.addEventListener("click", app.evts.clickQty);
	});

	// FB------------------------------
	console.log(window.location.href);
	// 這個可以抓到當前的網址
	// <div id="shareBtn">Share</div>
	app.createElement("a", {
		atrs: {
			id: "shareBtn",
			className: "fb_shareBtn",
			textContent: "Share"
		}
	}, app.get(".details")
	)
	let fbShareUrl = window.location.href;
	// FB Share Btn偵聽事件	
	app.get("#shareBtn").onclick = function () {
		console.log(`${fbShareUrl}`);
		FB.ui({
			method: 'share',
			display: 'popup',
			href: `${fbShareUrl}`,
		}, function (response) { });
	}

	// story
	app.get("#product-story").innerHTML = product.story;
	// video
	app.get("#product-video").href = `${product.video}`;
	console.log(`${product.video}`);
	// 有抓到YT網址
	app.createElement("iframe", {
		atrs: {
			src: `${product.video}`,
			width: "100%",
			height: "100%",
			frameborder: "0",
			allowfullscreen: "allowfullscreen"
		},
		stys:{
			borderStyle:"none"
		}
	}, app.get("#product-video"));

	// images
	for (let i = 0; i < 2 && i < product.images.length; i++) {
		app.createElement("img", {
			atrs: {
				src: product.images[i]
			}
		}, app.get("#product-images"));
	}
};
app.findVariant = function (colorCode, size) {
	let product = app.state.product;
	return product.variants.find((item) => { return item.color_code === colorCode && item.size === size });
};
app.refreshProductVariants = function () {
	let variants = app.state.product.variants;
	let variant = app.state.variant;
	let colors = app.getAll("#product-colors>.color");
	for (let i = 0; i < colors.length; i++) {
		if (colors[i].value.code === variant.color_code) {
			colors[i].classList.add("current");
		} else {
			colors[i].classList.remove("current");
		}
	}
	let sizes = app.getAll("#product-sizes>.size");
	let outStock;
	for (let i = 0; i < sizes.length; i++) {
		// control current
		if (sizes[i].value === variant.size) {
			sizes[i].classList.add("current");
		} else {
			sizes[i].classList.remove("current");
		}
		outStock = app.findVariant(variant.color_code, sizes[i].value).stock === 0;
		// control disabled
		if (outStock) {
			sizes[i].classList.add("disabled");
		} else {
			sizes[i].classList.remove("disabled");
		}
	}
	app.get("#product-qty>.value").textContent = app.state.qty;
};
app.evts.clickColor = function (e) {
	let color = e.currentTarget.value;
	let variants = app.state.product.variants;
	app.state.variant = app.findVariant(color.code, app.state.variant.size);
	if (app.state.variant.stock === 0) { // out of stock, choose another size automatically
		let sizes = app.state.product.sizes;
		let variant;
		for (let i = 0; i < sizes.length; i++) {
			variant = app.findVariant(color.code, sizes[i]);
			if (variant.stock > 0) {
				app.state.variant = variant;
				break;
			}
		}
	}
	app.state.qty = 1;
	app.refreshProductVariants();
};
app.evts.clickSize = function (e) {
	if (e.currentTarget.classList.contains("disabled")) {
		return;
	}
	let size = e.currentTarget.value;
	let variants = app.state.product.variants;
	app.state.variant = app.findVariant(app.state.variant.color_code, size);
	app.state.qty = 1;
	app.refreshProductVariants();
};
app.evts.clickQty = function (e) {
	let value = parseInt(e.currentTarget.getAttribute("data-value"));
	let qty = app.state.qty;
	qty = qty + value;
	if (qty > 0 && qty <= app.state.variant.stock) {
		app.state.qty = qty;
		app.get("#product-qty>.value").textContent = app.state.qty;
	}
};
window.addEventListener("DOMContentLoaded", app.init);


