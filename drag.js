class Drag {
  constructor({parent, item}) {
  	this.parent = parent;													// 父容器
  	this.item = item;															// 拖动的元素
  	this.isStart = 0;															// 是否开始 0未滚动 1滚动中 2滚动完成
    this.isdrag = false;  												// 是否移动
		this.touchY = 0;  														// 记录按下的起始位置
		this.moveY = 0;																// 元素移动的位置
		this.offsetY = 0;															// 按下时距离元素顶部的偏移距离
		this.lastMoveY = 0;  													// 记录最后移动到的位置
		this.thisItemPosTop = 0;  										// 当前item距离父元素顶部的高度
		this.thisItemHeight = 0; 											// 当前点击到的元素的高度
		this.moveHeight = 0;													// 拖拽元素改变其他元素的所需要的高度
		this.moveIndex = 0  													// 当前item移动的索引
		this.direction = null;  											// 移动方向
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
  }

  dragStart (item, event) {
  	if (this.isStart === 0) {
	  	event.preventDefault();

	  	var this_item = $(item);

	  	this.thisItemHeight = this_item.outerHeight();
	  	this.moveHeight = $(this.parent).innerHeight()/$(this.parent).children().length;

			// 记录初始位置和偏移的值
			this.isdrag = true;
			this.isStart = 1;
			this.touchY = event.originalEvent.touches[0].pageY;

			this.offsetY = this.touchY - this_item.offset().top;

			this_item.addClass("moving").siblings().addClass("disable");

			if (this_item.index() !== 0) {
				this.thisItemPosTop = this_item.position().top;
			}
		}
	}


  dragMove (item, event) {
  	if (this.isStart === 1) {
			event.preventDefault();

			var this_item = $(item);

			// 移动时产生的距离
			this.moveY = event.originalEvent.touches[0].pageY - this.touchY;

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
				this.moveIndex = Math.floor((Math.abs(this.moveY)+this.offsetY)/this.moveHeight);
				$(this.parent).children().eq(this.moveIndex+this_item.index()).not(this_item).css({
					"transform": `translate3d(0, ${-this.thisItemHeight}px, 0)`,
					"transition": ".3s"
				})
			} else {
				this.direction = "up"
				this.moveIndex = -Math.floor((Math.abs(this.moveY)+this.offsetY)/this.moveHeight);
				$(this.parent).children().eq(this.moveIndex+this_item.index()).not(this_item).css({
					"transform": `translate3d(0, ${this.thisItemHeight}px, 0)`,
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
	}


	dragEnd (item, event) {
		if (this.isStart === 1) {
			event.preventDefault();

			var this_item = $(item);

			this.isStart = 2;
			this.isdrag = false;
			this_item.removeClass("moving").siblings().removeClass("disable");

			//获取移动前的下标到移动后的下标之间的所有元素高度即是 tranlateY 的值
			let mheight = this.getItemHeight(this.direction, this_item.index(), this.moveIndex+this_item.index())
			if (this.moveIndex + this_item.index() > this_item.index()) {
				// 向下滑动
				this_item.css({
					"transform": `translate3d(0, ${mheight}px, 0)`,
					"transition": ".3s"
				})
			} else {
				// 向上滑动
				this_item.css({
					"transform": `translate3d(0, ${-mheight}px, 0)`,
					"transition": ".3s"
				})
			}

			// 用索引去更新实际位置
			setTimeout(() => {
				if (this.direction === "down") {
					$(this.parent).children().eq(this.moveIndex+this_item.index()).after(this_item);
				} else {
					$(this.parent).children().eq(this.moveIndex+this_item.index()).before(this_item);
				}

				$(this.parent).children().attr("style", "");
				$(this.parent).children().each((index, ele) => $(ele).find(".num").text(index+1));

				this.moveIndex = 0;
				this.isStart = 0;
			},300)
		}
	}

	// 获取元素原本的下标到滑到的下标的总距离
	getItemHeight (direction, startIndex, endIndex) {
		let totalHeight = 0;
		if (direction === "down") {
			for (let i = startIndex+1; i <= endIndex; i++) {
				totalHeight += $(this.parent).children().eq(i).outerHeight();
			}
		} else {
			for (let i = endIndex; i < startIndex; i++) {
				totalHeight += $(this.parent).children().eq(i).outerHeight();
			}
		}
		return totalHeight;
	}
	
}