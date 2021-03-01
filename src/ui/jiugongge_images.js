import { make, clazz, swapArrayItems } from "@groupher/editor-utils";
import GLightbox from "gLightbox";
import { remove } from "ramda";

import tippy, { hideAll } from "tippy.js";

import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// eslint-disable-next-line
import glightboxCss from "glightbox/dist/css/glightbox.min.css";

// eslint-disable-next-line
import css from "../styles/jiugongge.css";
import UploadIcon from "../icon/upload.svg";
import LinkAddIcon from "../icon/link-add.svg";

import PenIcon from "../icon/pen.svg";
import DeleteIcon from "../icon/delete.svg";

import { getExternalLinkPopoverOptions } from "./helper";
import { TMP_PIC } from "../constant";

/**
 * Class for working with Jiugongge UI:
 *  - rendering pictures with jiugongge style
 *  - add notes / drag position etc..
 *  - apply tune view
 */
export default class JiugonggeImages {
  /**
   * @param {object} api - Editor.js API
   */
  constructor({ api, data, onSelectFile, reRender }) {
    this.api = api;
    this.reRender = reRender;
    this.onSelectFile = onSelectFile;

    this.nodes = {
      wrapper: null,
    };

    this._data = data;

    this.draggingImage = null;
    /**
     * the lightbox for image preview
     */
    this.previewer = GLightbox({ loop: true });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      /**
       * jiugongge's classes
       */
      wrapper: "image-tool__image_jiugongge",
      block: "image-tool__jiugongge_block",
      image: "image-tool__jiugongge_block_image",
      toolbar: "image-tool__jiugongge_block_toolbar",
      toolbarDesc: "image-tool__jiugongge_block_toolbar__desc",
      toolbarIcon: "image-tool__jiugongge_block_toolbar__icon",
      toolbarSmallIcon: "image-tool__jiugongge_block_toolbar__icon_small",

      adderBlock: "image-tool__jiugongge_adder",
      upload: "image-tool__jiugongge_adder_upload",
      hint: "image-tool__jiugongge_adder_hint",
      hintIcon: "image-tool__jiugongge_adder_hint__icon",
      hintText: "image-tool__jiugongge_adder_hint__text",

      //
      descPopover: "image-tool__desc_popover",
      uploadPopover: "image-tool__upload_popover",
      uploadPopoverBtn: "image-tool__upload_popover_btn",
      uploadPopoverInput: "image-tool__upload_popover_textarea",

      //
      imageDragging: "image-dragging",
      imageDrop: "image-drop",
    };
  }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  render(data) {
    this._data = data;
    this.nodes.wrapper = make("div", this.CSS.wrapper);

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const blockEl = make("div", this.CSS.block);

      blockEl.addEventListener("click", () => {
        const s1 = this._data.items.slice(0, i);
        const s2 = this._data.items.slice(i, data.items.length);
        // 确保当前打开的在第一张显示
        const sortedItems = [...s2, ...s1];
        const imageEls = sortedItems.map((item) => ({
          href: item.src,
          type: "image",
          description: item.caption || "",
        }));

        this.previewer.setElements(imageEls);
        this.previewer.open();
      });

      const imageEl = make("img", this.CSS.image, {
        src: item.src,
        alt: "image",
        "data-image-index": i,
        "data-skip-plus-button": true,
        draggable: "true",
      });

      imageEl.addEventListener("dragstart", (e) => {
        clazz.add(e.target, this.CSS.imageDragging);
        this.draggingImage = imageEl;
      });

      imageEl.addEventListener("dragenter", (e) => {
        if (this.draggingImage !== imageEl) {
          clazz.add(e.target, this.CSS.imageDrop);
        }
      });

      // if the image is dragging to non-draggable area
      imageEl.addEventListener("dragend", (e) => {
        clazz.remove(e.target, this.CSS.imageDragging);
      });

      imageEl.addEventListener("dragover", (e) => {
        if (this.draggingImage !== imageEl) {
          clazz.add(e.target, this.CSS.imageDrop);
        }
      });

      imageEl.addEventListener("dragleave", (e) => {
        if (this.draggingImage !== imageEl) {
          clazz.remove(e.target, this.CSS.imageDrop);
        }
      });

      imageEl.addEventListener("drop", (e) => {
        clazz.remove(this.draggingImage, this.CSS.imageDragging);
        clazz.remove(e.target, this.CSS.imageDrop);
        const fromIndex = parseInt(this.draggingImage.dataset.imageIndex);
        const toIndex = parseInt(e.target.dataset.imageIndex);

        swapArrayItems(this._data.items, fromIndex, toIndex);
        this.draggingImage = null;

        this.reRender(this._data);
      });

      blockEl.appendChild(imageEl);
      blockEl.appendChild(this._drawInlineToolbar(i, item.caption));

      // hide all popover when leave
      // blockEl.addEventListener("mouseleave", () => hideAll());

      this.nodes.wrapper.appendChild(blockEl);
    }

    // add adder if needed
    if (data.items.length < 9) {
      this.nodes.wrapper.appendChild(this._drawAdder());
    }

    return this.nodes.wrapper;
  }

  /**
   * delete picture from current items
   *
   * @param {Number} index - index in _data.items
   * @memberof Jiugongge
   * @private
   */
  _deletePicture(index) {
    this._data.items = remove(index, 1, this._data.items);
    this.reRender(this._data);
  }

  /* draw inline toolbar
   *
   * @memberof Jiugongge
   */
  _drawInlineToolbar(index, desc) {
    const wrapperEl = make("div", this.CSS.toolbar, {
      "data-toolbar": index,
    });

    const descEl = make("div", this.CSS.toolbarDesc, {
      innerHTML: desc,
    });

    // 添加说明，更换图片，删除，下载
    const descIconEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: PenIcon,
    });
    const uploadEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: UploadIcon,
    });
    const deleteEl = make(
      "div",
      [this.CSS.toolbarIcon, this.CSS.toolbarSmallIcon],
      {
        innerHTML: DeleteIcon,
      }
    );

    deleteEl.addEventListener("click", (e) => this._deletePicture(index));

    tippy(descIconEl, this._drawDescOptions(index));
    tippy(uploadEl, this._drawUploadOptions(index));

    this.api.tooltip.onHover(descIconEl, "添加描述", { delay: 1500 });
    this.api.tooltip.onHover(uploadEl, "重新上传", { delay: 500 });
    this.api.tooltip.onHover(deleteEl, "删除", { delay: 500 });

    if (!!desc) {
      wrapperEl.appendChild(descEl);
    }

    wrapperEl.appendChild(descIconEl);
    wrapperEl.appendChild(uploadEl);
    wrapperEl.appendChild(deleteEl);

    // avoid trigger previewer the whole picture
    wrapperEl.addEventListener("click", (e) => e.stopPropagation());

    return wrapperEl;
  }

  /**
   * draw picture desc input
   * @param {number} index
   * @return tippy options
   * @memberof Gallery
   */
  _drawDescOptions(index) {
    const wrapperEl = make("div", this.CSS.descPopover);
    const textareaEl = make("textarea", "", {
      placeholder: "添加描述..",
      value: this._data.items[index].caption || "",
    });

    textareaEl.addEventListener("input", (e) => {
      this._data.items[index].caption = e.target.value;
    });

    textareaEl.addEventListener("blur", (e) => {
      const toolbarEl = this.nodes.wrapper.querySelector(
        `[data-toolbar='${index}']`
      );
      toolbarEl.replaceWith(this._drawInlineToolbar(index, e.target.value));
    });

    wrapperEl.appendChild(textareaEl);

    return {
      content: wrapperEl,
      theme: "light",
      // delay: 200,
      trigger: "click",
      placement: "bottom",
      // allowing you to hover over and click inside them.
      interactive: true,
      onShow() {
        setTimeout(() => textareaEl.focus());
      },
    };
  }

  /**
   * draw picture upload options input
   * @return tippy options
   * @memberof Gallery
   */
  _drawUploadOptions() {
    const wrapperEl = make("div", this.CSS.uploadPopover);
    const localUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "本地上传",
    });

    const linkUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "图片链接",
    });

    const linkUploadTextareaEl = make("textarea", this.CSS.uploadPopoverInput, {
      placeholder: "链接地址",
    });

    linkUploadEl.addEventListener("click", (e) => {
      linkUploadTextareaEl.style.display = "block";
      linkUploadTextareaEl.focus();
    });

    linkUploadTextareaEl.addEventListener("blur", (e) => {
      linkUploadTextareaEl.style.display = "none";
    });

    wrapperEl.appendChild(localUploadEl);
    wrapperEl.appendChild(linkUploadEl);
    wrapperEl.appendChild(linkUploadTextareaEl);

    return {
      content: wrapperEl,
      theme: "light",
      // delay: 200,
      trigger: "click",
      placement: "bottom",
      // allowing you to hover over and click inside them.
      interactive: true,
    };
  }

  /**
   * draw adder block
   * @return {HTMLElement}
   * @memberof Gallery
   */
  _drawAdder() {
    const adderEl = make("div", this.CSS.adderBlock);
    const uploadIconEl = make("div", this.CSS.upload, {
      innerHTML: UploadIcon,
    });

    uploadIconEl.addEventListener("click", () => {
      this.onSelectFile();
    });

    const hintEl = make("div", this.CSS.hint);

    const hintIconEl = make("div", this.CSS.hintIcon, {
      innerHTML: LinkAddIcon,
    });

    const hintTextEl = make("div", this.CSS.hintText, {
      innerHTML: "外部链接",
    });

    tippy(
      hintTextEl,
      getExternalLinkPopoverOptions(this._data, -1, (data) =>
        this.reRender(data)
      )
    );

    hintEl.appendChild(hintIconEl);
    hintEl.appendChild(hintTextEl);

    adderEl.appendChild(uploadIconEl);
    adderEl.appendChild(hintEl);

    // hide all popover when leave
    adderEl.addEventListener("mouseleave", () => hideAll());

    return adderEl;
  }
}
