
  var delay = {
    execute: function(cb, arg) {
      cb(arg);
      delete this.timeoutID;
    },
    start: function(cb, arg, delay) {
      this.cancel();
      var self = this;
      this.timeoutID = window.setTimeout(function() {
        self.execute(cb, arg);
      }, delay);
    },
    cancel: function() {
      if (typeof this.timeoutID == "number") {
        window.clearTimeout(this.timeoutID);
        delete this.timeoutID;
      }
    }
  };
  /**
   * YouShallPass constructor;
   * @param {String} pattern [pattern string]
   * @param {int} delay [delay time (ms)]
   */
  function YouShallPass(elem, pattern, delay) {
    this.elem = elem;
    elem.addEventListener("input", this.keyboardInputHandle.bind(this))
    elem.addEventListener("paste", this.keyboardPasteHandle.bind(this))
    elem.addEventListener("keyup", this.keyboardKeyupHandle.bind(this))
    elem.addEventListener("keydown", this.keyboardKeydownHandle.bind(this))
    elem.addEventListener("compositionstart", this.keyboardCompositionStartHandle.bind(this))
    elem.addEventListener("compositionend", this.keyboardCompositionEndHandle.bind(this))
    // set pattern
    if (typeof pattern === "string") {
      this.pattern = pattern;
    } else {
      console.warn("pattern is not string");
    }
    // set delay
    if (typeof delay === "number" && delay > 0) {
      this.delay = delay;
    } else if (delay) {
      console.warn("delay is not positive number");
    }
  }
  YouShallPass.prototype = {
    visible: false,
    // password input real value
    realText: "",
    // fix ie9 oninput 'delete' key fire bug
    fixIE9: function() {
      (function(d) {
        if (navigator.userAgent.indexOf('MSIE 9') === -1) return;
        d.addEventListener('selectionchange', function() {
          var el = d.activeElement;
          if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
            var ev = d.createEvent('CustomEvent');
            ev.initCustomEvent('input', true, true, {});
            el.dispatchEvent(ev);
          }
        });
      })(document);
    },
    // password mask pattern generator
    pointGen: function(pattern, num) {
      return Array.apply(null, Array(num)).map(function() {
        return pattern
      }).join("")
    },
    toggleVisibility: function(visible) {
      this.visible = visible;
      delay.cancel();
      if (visible)
        this.elem.value = this.realText;
      else
        this.elem.value = this.pointGen(this.pattern, this.realText.length);
    },
    delayEffect: function(arg) {
      arg.value = this.pointGen(this.pattern, arg.value.length);
    },
    // oninput handle
    keyboardInputHandle: function(e) {
      if (this.composing) return;
      var preVal = this.realText;
      // insert cursor location
      var nowVal = e.target.value;
      // increase length of input's value
      var incre;
      var index = this.elem.selectionStart;
      var indexEnd = this.elem.selectionEnd;
      var newStr;
      if (this.last_keydown !== undefined) {
        index = this.last_keydown.index;
        indexEnd = this.last_keydown.indexEnd;
        incre = nowVal.length - (preVal.length - (indexEnd - index));
        newStr = nowVal.slice(index, index + incre);
        this.realText = preVal.slice(0, index) + newStr + preVal.slice(indexEnd);
        this.elem.setSelectionRange(index + incre, index + incre);
        this.toggleVisibility(this.visible);
        return;
      } else {
        incre = nowVal.length - preVal.length;
        newStr = nowVal.slice(index - incre, index);
        this.realText = preVal.slice(0, index - newStr.length) + newStr + preVal.slice(index - newStr.length);
      }
      // render mask effect
      if (nowVal.length > 0) {
        if (this.visible) {
          e.target.value = this.realText;
        } else {
          e.target.value = this.pointGen(this.pattern, nowVal.length);
          // e.target.value = this.pointGen(this.pattern, nowVal.length - 1) + nowVal.charAt(nowVal.length - 1);
          // delay.start(this.delayEffect.bind(this), e.target, this.delay);
        }
      }
      // reset insert cursor location
      this.elem.setSelectionRange(index, index);
    },
    keyboardCompositionStartHandle: function(e) {
      this.composing = true;
      var index = this.elem.selectionStart;
      var indexEnd = this.elem.selectionEnd;
      var nowVal = this.realText;
      var newVal;
      if (index != indexEnd) {
        newVal = nowVal.slice(0, index) + nowVal.slice(indexEnd);
        this.realText = newVal;
        this.toggleVisibility(this.visible);
        this.elem.setSelectionRange(index, index);
      }
    },
    keyboardCompositionEndHandle: function(e) {
      this.composing = false;
      var index = this.elem.selectionStart;
      var preVal = this.realText;
      var nowVal = e.target.value;
      var incre = nowVal.length - preVal.length;
      var newStr = nowVal.slice(index - incre, index);
      this.realText = preVal.slice(0, index - incre) + newStr + preVal.slice(index - incre);
      if (nowVal.length > 0) {
        if (this.visible) {
          e.target.value = this.realText;
        } else {
          e.target.value = this.pointGen(this.pattern, nowVal.length)
          // e.target.value = this.pointGen(this.pattern, nowVal.length - 1) + nowVal.charAt(nowVal.length - 1);
          // delay.start(this.delayEffect.bind(this), e.target, this.delay);
        }
      }
      // reset insert cursor location
      this.elem.setSelectionRange(index, index);
    },
    keyboardPasteHandle: function(e) {
      var clipboardData, pastedData;
      // Stop data actually being pasted into div
      e.stopPropagation();
      e.preventDefault();
      // Get pasted data via clipboard API
      clipboardData = e.clipboardData || window.clipboardData;
      pastedData = clipboardData.getData('Text');
      var index = this.elem.selectionStart;
      var indexEnd = this.elem.selectionEnd;
      var nowVal = this.realText;
      var newVal = nowVal.slice(0, index) + pastedData + nowVal.slice(indexEnd);
      this.realText = newVal;
      this.toggleVisibility(this.visible);
      // reset insert cursor location
      this.elem.setSelectionRange(index + pastedData.length, index + pastedData.length);
    },
    keyboardKeyupHandle: function(e) {},
    keyboardKeydownHandle: function(e) {
      var index = this.elem.selectionStart;
      var indexEnd = this.elem.selectionEnd;
      var nowVal = this.realText;
      var newVal;
      if (event.keyCode == 8) { // BACKSPACE was pressed
        e.stopPropagation();
        e.preventDefault();
        if (index != indexEnd) {
          newVal = nowVal.slice(0, index) + nowVal.slice(indexEnd);
          this.realText = newVal;
          this.toggleVisibility(this.visible);
          this.elem.setSelectionRange(index, index);
        } else {
          newVal = nowVal.slice(0, index - 1) + nowVal.slice(indexEnd);
          this.realText = newVal;
          this.toggleVisibility(this.visible);
          this.elem.setSelectionRange(index - 1, index - 1);
        }
      } else if (event.keyCode == 46) { // DELETE was pressed
        e.stopPropagation();
        e.preventDefault();
        if (index != indexEnd) {
          newVal = nowVal.slice(0, index) + nowVal.slice(indexEnd);
          this.realText = newVal;
          this.toggleVisibility(this.visible);
          this.elem.setSelectionRange(index, index);
        } else {
          newVal = nowVal.slice(0, index) + nowVal.slice(indexEnd + 1);
          this.realText = newVal;
          this.toggleVisibility(this.visible);
          this.elem.setSelectionRange(index + 1, index + 1);
        }
      } else {
        if (index != indexEnd) {
          this.last_keydown = {
            index: index,
            indexEnd: indexEnd,
          };
        } else {
          this.last_keydown = undefined;
        }
      }
    }
  }
  
  export default YouShallPass;