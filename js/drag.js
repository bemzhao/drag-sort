class Drag {
  constructor({parent, item}) {
  	this.parent = parent;									// 父容器
  	this.item = item;											// 拖动的元素
  	this.isStart = -1;										// 是否开始 0未滚动 1滚动中 2滚动完成
    this.isDrag = false;  								// 是否移动
    this.canDrag = null;									// 定时器判断是滚动页面还是拖拽元素
		this.touchY = 0;  										// 记录按下的起始位置
		this.moveY = 0;												// 元素移动的位置
		this.offsetY = 0;											// 按下时距离元素顶部的偏移距离
		this.lastMoveY = 0;  									// 记录最后移动到的位置
		this.thisItemPosTop = 0;  						// 当前 item 距离父元素顶部的高度
		this.thisItemHeight = 0; 							// 当前点击到的元素的高度
		this.moveIndex = 0  									// 当前 item 移动的索引
		this.direction = null;  							// 移动方向
		this.time = null;											// 计时器，用于执行定时判断拖拽元素的位置
		this.thisScrollTop = 0;								// 当前的滚动条高度
		this.init();
  }

  init () {
  	var that = this;

  	$(this.parent).on("touchstart", this.item, function(event){
  		that.dragStart(this, event)
  	});
  	$(this.parent).on("touchmove", this.item, function(event){
  		that.dragMove(this, event)
  	});
  	$(this.parent).on("touchend", this.item, function(event){
  		that.dragEnd(this, event)
  	});
  	$(this.parent).on("click", this.item, function(event){
  		that.handleClick(this, event)
  	});
  }

  dragStart (item, event) {
  	this.canDrag = setTimeout(()=>{
  		this.isStart = 0;
  		if (this.isStart === 0) {
		  	event.preventDefault();

		  	var this_item = $(item);
		  	var this_parent = $(this.parent);

		  	this_item.css({"pointer-events": "none"})

		  	this.thisItemHeight = this_item.outerHeight();

				// 记录初始位置和偏移的值
				this.isDrag = true;
				this.isStart = 1;
				this.touchY = event.originalEvent.touches[0].pageY;

				this.offsetY = this.touchY - this_item.offset().top;

				this_item.addClass("moving").siblings().addClass("disable");

				if (this_item.index() !== 0) {
					this.thisItemPosTop = this_item.position().top;
				}
			}
  	}, 500)
	}

  dragMove (item, event) {
  	if (this.isStart === -1) {
  		clearTimeout(this.canDrag);
  	}
  	if (this.isStart === 1) {
			event.preventDefault();

			var this_item = $(item);
			var this_parent = $(this.parent);

			// 判断触点的 clientY 是在顶部还是在底部，然后再设置页面的滚动距离
			var clientHeight = document.documentElement.clientHeight;
			if (event.originalEvent.touches[0].clientY > clientHeight*.9) {
				clearInterval(this.time)
				this.time = setInterval(()=> {
					this.thisScrollTop =  $(document).scrollTop();
					$(document).scrollTop(this.thisScrollTop + 5);
				},15)
			} else if (event.originalEvent.touches[0].clientY < clientHeight*.1) {
				clearInterval(this.time)
				this.time = setInterval(()=> {
					this.thisScrollTop =  $(document).scrollTop();
					$(document).scrollTop(this.thisScrollTop - 5);
				},15)
			}else{
				clearInterval(this.time)
			}

			// 移动时产生的距离
			this.moveY = event.originalEvent.touches[0].pageY - this.touchY;

			// 限制移动范围
			var maxY = this_parent.outerHeight() - this_item.innerHeight()
			if (this_item.index() === 0) {
				// 第一个item的移动
				// min取向下移动的最大距离，max取向上移动的最大距离
				this.moveY = Math.min(Math.max(0, this.moveY), maxY)
			} else {
				// 其他item的移动
				this.moveY = Math.min(Math.max(-this.thisItemPosTop, this.moveY), maxY-this.thisItemPosTop)
			}

			// 改变当前拖拽的item位置
			if (this.isDrag === true) {
				this_item.css({"transform": `translate3d(0, ${this.moveY}px, 0)`})
			}
			
			// 判断滑动方向
			// 通过获取手指的移动时产生的触点来获取触碰到的元素
			let ele = document.elementFromPoint(event.originalEvent.touches[0].clientX, event.originalEvent.touches[0].clientY);
			if (!$(ele).hasClass(this.item.replace('.',''))) {
				return false;
			}

			// 判断触点第一次离开的方向是向下还是向上
			if (this.moveY > 0 && this_item.index() < $(ele).index()) {
				this.direction = "down"
		  	$(ele).css({
		  		"transform": `translate3d(0, ${-this.thisItemHeight}px, 0)`,
		  		"transition": ".3s"
		  	}).attr("data-move", "-1")
			} 
			if (this.moveY < 0 && this_item.index() > $(ele).index()) {
				this.direction = "up"
				$(ele).css({
		  		"transform": `translate3d(0, ${this.thisItemHeight}px, 0)`,
		  		"transition": ".3s"
		  	}).attr("data-move", "1")
			}
			
			// 触点第一次离开之后返回都经过了同个元素判断是向上还是向下
			if (this.direction === "down" && this.lastMoveY > this.moveY && $(ele).attr("data-move") === "-1") {
				// console.log("原本向下现在向上")
				$(ele).css({
		  		"transform": `translate3d(0, 0, 0)`,
		  		"transition": ".3s"
		  	}).attr("data-move", "")
			}
			if (this.direction === "up" && this.lastMoveY < this.moveY && $(ele).attr("data-move") === "1") {
				// console.log("原本向上现在向下")
				$(ele).css({
		  		"transform": `translate3d(0, 0, 0)`,
		  		"transition": ".3s"
		  	}).attr("data-move", "")
			}

			if (this.time !== null) {
				if (this.direction === "down") {
					this_item.nextUntil($(ele), this.item).css({
						"transform": `translate3d(0, ${-this.thisItemHeight}px, 0)`,
						"transition": ".3s"
					})
					this_item.nextUntil($(ele), this.item).attr("data-move", "-1")
					$(this.item).each((index, ele) => {
						if ($(ele).attr('data-move') === "1") {
							$(ele).css({
								"transform": `translate3d(0, 0, 0)`,
								"transition": ".3s"
							}).attr("data-move", "")
						}
					})
				}
				if (this.direction === "up") {
					this_item.prevUntil($(ele), this.item).css({
						"transform": `translate3d(0, ${this.thisItemHeight}px, 0)`,
						"transition": ".3s"
					})
					this_item.prevUntil($(ele), this.item).attr("data-move", "1")
					$(this.item).each((index, ele) => {
						if ($(ele).attr('data-move') === "-1") {
							$(ele).css({
								"transform": `translate3d(0, 0, 0)`,
								"transition": ".3s"
							}).attr("data-move", "")
						}
					})
				}
			}

			this.lastMoveY = this.moveY
		}
	}

	dragEnd (item, event) {
		if (this.isStart === 1) {
			event.preventDefault();

			clearInterval(this.time)

			var this_item = $(item);
			var this_parent = $(this.parent);

			this_item.css({"pointer-events": "auto"})

			this.isStart = 2;
			this.isDrag = false;
			this.time = null
			this_item.removeClass("moving").siblings().removeClass("disable");

			if (this.direction === 'down') {
				let downlast = $(this.item+'[data-move=-1]').last();
				if (downlast.length > 0) {
					this_item.nextUntil(downlast, this.item).attr("data-move", "-1")
				}
			} else {
				let uplast = $(this.item+'[data-move=1]').last();
				if (uplast.length > 0) {
					this_item.prevUntil(uplast, this.item).attr("data-move", "1")
				}
			}
			

			// 计算有多少个 data-move
			// 为 -1 就用 data-move 的个数加原有的元素本身的下标,为 1 就用原本的下标减 data-move 的个数
			let datasetArr = [];	// 获取到的 data-move 的数组
			let mheight = 0;			// 移动到正确位置时 translate3d 值
			$(this.item).each((index, ele) => {
				datasetArr.push($(ele).attr('data-move'))
				$(ele).attr('data-move', '')
			})
			if (datasetArr.some((item) => {return item === "-1"})) {
				this.moveIndex = this.getTotalInArr(datasetArr, "-1");
				mheight = this.getItemHeight(this.direction, this_item.index(), this.moveIndex+this_item.index())
				this_item.css({
					"transform": `translate3d(0, ${mheight}px, 0)`,
					"transition": ".3s"
				})
			} else {
				this.moveIndex = this.getTotalInArr(datasetArr, "1");
				mheight = this.getItemHeight(this.direction, this_item.index(), this_item.index()-this.moveIndex)
				this_item.css({
					"transform": `translate3d(0, ${-mheight}px, 0)`,
					"transition": ".3s"
				})
			}

			// 用索引去更新实际位置
			setTimeout(() => {
				if (this.direction === "down") {
					this_parent.children().eq(this.moveIndex+this_item.index()).after(this_item);
				} else {
					this_parent.children().eq(this_item.index()-this.moveIndex).before(this_item);
				}

				this_parent.children().attr("style", "");
				this_parent.children().each((index, ele) => $(ele).find(".num").text(index+1));

				this.moveIndex = 0;
				this.isStart = -1;
			},300)
		}
	}

	handleClick (item, event) {
  	clearTimeout(this.canDrag);
  }

	/*
		获取元素原本的下标到滑到的下标的总距离
		direction -> 方向
		moveStartIndex -> 移动前的起始下标
		moveEndIndex -> 移动结束后的下标
	*/
	getItemHeight (direction, moveStartIndex, moveEndIndex) {
		let totalHeight = 0;
		if (direction === "down") {
			for (let i = moveStartIndex+1; i <= moveEndIndex; i++) {
				totalHeight += $(this.parent).children().eq(i).outerHeight();
			}
		} else {
			for (let i = moveEndIndex; i < moveStartIndex; i++) {
				totalHeight += $(this.parent).children().eq(i).outerHeight();
			}
		}
		return totalHeight;
	}

	/*
		计算某个字段在数组中出现过多少次
		arr -> 数组
		value -> 要计算的字段
	*/
	getTotalInArr (arr, value) {
		return arr.reduce((a, v) => v === value ? a + 1 : a + 0, 0)
	}
	
}