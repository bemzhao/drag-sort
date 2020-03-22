class Drag {
  constructor(parent, item) {
  	this.parent = parent;													// 父容器
  	this.item = item;															// 拖动的元素
    this.isdrag = false;  												// 是否移动
		this.touchY = 0;  														// 记录按下的起始位置
		this.moveY = 0;																// 元素移动的位置
		this.offsetY = 0;															// 按下时偏移的位置
		this.lastMoveY = null;  											// 记录最后移动到的位置
		this.thisItemPosTop = 0;  										// 当前item距离父元素顶部的高度
		this.itemHeight = $(this.item).outerHeight(); // item的高度
		this.moveIndex = 0  													// 当前item移动的索引
		this.direction = null;  											// 移动方向
		this.init();
  }

  init () {
  	$(this.item).on("touchstart", this.dragStart.bind(this, event));
  	$(this.item).on("touchmove", this.dragMove.bind(this, event));
  	$(this.item).on("touchend", this.dragEnd.bind(this, event));
  }

  dragStart () {
  	event.preventDefault();

  	var this_item = $(event.currentTarget);

		// 记录初始位置和偏移的值
		this.isdrag = true;
		this.touchY = event.targetTouches[0].pageY

		this.offsetY = this.touchY - this_item.offset().top;

		this_item.addClass("moving").siblings().addClass("disable");

		if (this_item.index() !== 0) {
			this.thisItemPosTop = this_item.position().top;
		}
	}


  dragMove () {
		event.preventDefault();

		var this_item = $(event.currentTarget);

		// 移动时产生的距离
		this.moveY = event.targetTouches[0].pageY - this.touchY;

		// 限制移动范围
		var maxY = $(this.parent).outerHeight() - this_item.innerHeight()
		if (this_item.index() === 0) {
			// 第一个item的移动
			// min取向下移动的最大距离，max取向上移动的最大距离
			this.moveY = Math.min(Math.max(0, this.moveY), maxY)
		} else {
			// 其他item的移动
			this.moveY = Math.min(Math.max(-this.thisItemPosTop, this.moveY), maxY-this.thisItemPosTop)
		}

		// 改变当前拖拽的item位置
		if (this.isdrag === true) {
			this_item.css({"transform": `translate3d(0, ${this.moveY}px, 0)`})
		}
		
		// 判断滑动方向
		// 移动了多少个索引加上自身的索引就是需要变化的那个索引
		if (this.moveY > 0) {
			this.direction = "down"
			this.moveIndex = Math.floor((Math.abs(this.moveY)+this.offsetY)/this.itemHeight);
			$(this.parent).children().eq(this.moveIndex+this_item.index()).not(this_item).css({
				"transform": `translate3d(0, ${-this.itemHeight}px, 0)`,
				"transition": ".3s"
			})
		} else {
			this.direction = "up"
			this.moveIndex = -Math.floor((Math.abs(this.moveY)+this.offsetY)/this.itemHeight);
			$(this.parent).children().eq(this.moveIndex+this_item.index()).not(this_item).css({
				"transform": `translate3d(0, ${this.itemHeight}px, 0)`,
				"transition": ".3s"
			})
		}
		
		// 移动回原位时不改变位置
		if (this.lastMoveY == this.moveY) {
			return;
		}
		// 判断上滑还是下滑
		if (this.lastMoveY > this.moveY) {
			// console.log("向上")
			if (this.direction === "down") {
				$(this.parent).children().eq(this.moveIndex+this_item.index()+1).not(this_item).stop().css({
					"transform": `translate3d(0, 0, 0)`,
					"transition": ".3s"
				})
			}
		} else{
			// console.log("向下")
			if (this.direction === "up") {
				$(this.parent).children().eq(this.moveIndex+this_item.index()-1).not(this_item).stop().css({
					"transform": `translate3d(0, 0, 0)`,
					"transition": ".3s"
				})
			}
		}

		this.lastMoveY = this.moveY
	}


	dragEnd () {
		event.preventDefault();

		var this_item = $(event.currentTarget);

		this.isdrag = false;
		this_item.removeClass("moving").siblings().removeClass("disable");

		// 设置当前的item的位置
		this_item.css({
			"transform": `translate3d(0, ${this.moveIndex*this.itemHeight}px, 0)`,
			"transition": ".3s"
		})

		// 用索引去更新实际位置
		setTimeout(() => {
			if (this.direction === "down") {
				$(this.parent).children().eq(this.moveIndex+this_item.index()).after(this_item);
			} else {
				$(this.parent).children().eq(this.moveIndex+this_item.index()).before(this_item);
			}
			this.moveIndex = 0;
			$(this.parent).children().attr("style", "");
			$(this.parent).children().each((index, ele) => $(ele).find(".num").text(index+1));
		},300)
	}

}