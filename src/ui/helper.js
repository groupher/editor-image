import { make, isValidURL, debounce } from "@groupher/editor-utils";

import ConfirmIcon from "../icon/confirm.svg";
import NoticeMarkIcon from "../icon/notice-mark.svg";

/**
 * @typedef {Object} ImageData
 * @description Table Tool's  data format
 * @property {number} columnCount — column count
 * @property {String} mode - single | jiugongge | gallery
 * @property {[ImageItem]} items - array of cell item
 */

/**
 * @typedef {Object} ImageItem
 * @description image item
 * @property {String} src - image src link address
 * @property {String} desc
 * @property {String} width
 * @property {String} height
 */

const CSS = {
  descPopover: "image-tool__desc_popover",
  popover: "image-tool__popover",
  popoverInputWrapper: "image-tool__popover_input_wrapper",
  popoverLinkInput: "image-tool__popover_input_wrapper_input",
  popoverLinkConfirm: "image-tool__popover_input_wrapper_confirm",
  popoverLinkNote: "image-tool__popover_note",
  popoverErrorMsg: "image-tool__popover_error",
};

/**
 * draw desc input popover format for given picture index
 *
 * @param {Number} index - picture index
 * @param {ImageData} data - imageToolData
 * @param {HTMLElement} node - the root node of image tool
 * @param {Function} blurCallback - blur call back
 * @returns
 */
export const getDescInputPopoverOptions = (index, data, node, blurCallback) => {
  const WrapperEl = make("div", CSS.descPopover);
  const TextareaEl = make("textarea", "", {
    placeholder: "添加描述..",
    value: data.items[index].desc || "",
  });

  TextareaEl.addEventListener("input", (e) => {
    data.items[index].desc = e.target.value;
  });

  TextareaEl.addEventListener("blur", (e) => {
    const toolbarEl = node.querySelector(`[data-toolbar='${index}']`);
    // toolbarEl.replaceWith(this._drawInlineToolbar(index, e.target.value));
    toolbarEl.replaceWith(blurCallback(index, e.target.value));
  });

  WrapperEl.appendChild(TextareaEl);

  return {
    content: WrapperEl,
    theme: "light",
    // delay: 200,
    trigger: "click",
    placement: "bottom",
    // allowing you to hover over and click inside them.
    interactive: true,
    onShow() {
      setTimeout(() => TextareaEl.focus());
    },
  };
};

/**
 * draw desc input popover format for given picture index
 *
 * @param {Number} index - picture index
 * @param {ImageData} data - imageToolData
 * @param {HTMLElement} node - the root node of image tool
 * @returns {Object} - tippy options
 */
export const getExternalLinkPopoverOptions = (data, index, callback) => {
  const WrapperEl = make("div", CSS.popover);
  const item = data.items[index] || {};
  let inputVal = "";

  const InputWrapperEl = make("div", CSS.popoverInputWrapper);

  const InputEl = make("input", CSS.popoverLinkInput, {
    placeholder: "请输入外链地址",
    value: item.src || "",
  });
  const NoteEl = make("div", CSS.popoverLinkNote, {
    innerHTML: "请确保该链接支持外链，否则图片可能无法正常显示",
  });
  const ErrorEl = make("div", CSS.popoverErrorMsg, {
    innerHTML: `${NoticeMarkIcon}请输入合法的 https:// 格式的链接。`,
  });
  const ConfirmBtnEl = make("div", CSS.popoverLinkConfirm, {
    innerHTML: ConfirmIcon,
  });

  ConfirmBtnEl.addEventListener("click", () => {
    if (!data.items[index]) {
      callback({
        ...data,
        items: [
          {
            src: inputVal,
          },
        ],
      });
    } else {
      item.src = inputVal;
      callback(data);
    }
  });

  InputWrapperEl.appendChild(InputEl);
  InputWrapperEl.appendChild(ConfirmBtnEl);

  const syncVal = debounce((val) => {
    inputVal = val;
    if (!inputVal) {
      ErrorEl.style.display = "none";
    }

    if (isValidURL(inputVal)) {
      ConfirmBtnEl.style.display = "flex";
      ErrorEl.style.display = "none";
    } else {
      ConfirmBtnEl.style.display = "none";
      if (!!inputVal) {
        ErrorEl.style.display = "block";
      }
    }
  }, 200);

  InputEl.addEventListener("focus", (e) => syncVal(e.target.value));
  InputEl.addEventListener("input", (e) => syncVal(e.target.value));
  InputEl.addEventListener("blur", (e) => syncVal(e.target.value));

  WrapperEl.appendChild(InputWrapperEl);
  WrapperEl.appendChild(NoteEl);
  WrapperEl.appendChild(ErrorEl);

  return {
    content: WrapperEl,
    theme: "light",
    trigger: "click",
    placement: "bottom",
    // allowing you to hover over and click inside them.
    interactive: true,
    onShow() {
      setTimeout(() => InputEl.focus());
    },
  };
};
