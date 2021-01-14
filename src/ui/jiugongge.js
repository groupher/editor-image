import { make } from "@groupher/editor-utils";
import GLightbox from "gLightbox";

import tippy, { hideAll } from "tippy.js";

import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// eslint-disable-next-line
import glightboxCss from "glightbox/dist/css/glightbox.min.css";

import { remove } from "ramda";

// eslint-disable-next-line
import css from "../styles/jiugongge.css";
import UploadIcon from "../icon/upload.svg";
import LinkAddIcon from "../icon/link-add.svg";

import PenIcon from "../icon/pen.svg";
import DeleteIcon from "../icon/delete.svg";

import { TMP_PIC } from "../constant";

/**
 * Class for working with Jiugongge UI:
 *  - rendering pictures with jiugongge style
 *  - add notes / drag position etc..
 *  - apply tune view
 */
export default class Jiugongge {
  /**
   * @param {object} api - Editor.js API
   */
  constructor({ api, reRender }) {
    this.api = api;
    this.reRender = reRender;

    this.nodes = {
      wrapper: null,
    };

    this._data = {};

    this.previewer = GLightbox({ loop: true });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      // baseClass: this.api.styles.block,
      // loading: this.api.styles.loader,
      // input: this.api.styles.input,
      // button: this.api.styles.button,

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

      adderBlock: "image-tool__jiugongge_adder_block",
      upload: "image-tool__jiugongge_adder_block_upload",
      hint: "image-tool__jiugongge_adder_block_hint",
      hintIcon: "image-tool__jiugongge_adder_block_hint__icon",
      hintText: "image-tool__jiugongge_adder_block_hint__text",

      //
      descPopover: "image-tool__desc_popover",
      uploadPopover: "image-tool__upload_popover",
      uploadPopoverBtn: "image-tool__upload_popover_btn",
      uploadPopoverInput: "image-tool__upload_popover_textarea",
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
      const BlockEl = make("div", this.CSS.block);

      BlockEl.addEventListener("click", () => {
        const s1 = this._data.items.slice(0, i);
        const s2 = this._data.items.slice(i, data.items.length);
        // 确保当前打开的在第一张显示
        const sortedItems = [...s2, ...s1];
        const imageElements = sortedItems.map((item) => ({
          href: item.src,
          type: "image",
        }));

        this.previewer.setElements(imageElements);
        this.previewer.open();
      });

      const ImageEl = make("img", this.CSS.image, {
        src: item.src,
        alt: "image",
      });

      // ImageWrapperEl.appendChild(ImageEl);
      // BlockEl.appendChild(ImageWrapperEl);

      BlockEl.appendChild(ImageEl);
      BlockEl.appendChild(this._drawInlineToolbar(i, item.desc));

      // hide all popover when leave
      BlockEl.addEventListener("mouseleave", () => hideAll());

      this.nodes.wrapper.appendChild(BlockEl);
    }

    // add adder if needed
    if (data.items.length < 9) {
      this.nodes.wrapper.appendChild(this._drawAdder());
    }

    return this.nodes.wrapper;
  }

  /**
   * add picture
   *
   * @memberof Jiugongge
   * @private
   */
  _addLocalPicture() {
    const index = this._data.items.length;

    this._data.items.push({
      index: index,
      src: TMP_PIC[index],
    });

    this.reRender(this._data);
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
    const WrapperEl = make("div", this.CSS.toolbar, {
      "data-toolbar": index,
    });

    const DescEl = make("div", this.CSS.toolbarDesc, {
      innerHTML: desc,
    });

    // 添加说明，更换图片，删除，下载
    const DescIconEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: PenIcon,
    });
    const UploadEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: UploadIcon,
    });
    const DeleteEl = make(
      "div",
      [this.CSS.toolbarIcon, this.CSS.toolbarSmallIcon],
      {
        innerHTML: DeleteIcon,
      }
    );

    DeleteEl.addEventListener("click", (e) => this._deletePicture(index));

    tippy(DescIconEl, this._drawDescInputer(index));
    tippy(UploadEl, this._drawUploadOptions(index));

    this.api.tooltip.onHover(DescIconEl, "添加描述", { delay: 1500 });
    this.api.tooltip.onHover(UploadEl, "重新上传", { delay: 500 });
    this.api.tooltip.onHover(DeleteEl, "删除", { delay: 500 });

    if (!!desc) {
      WrapperEl.appendChild(DescEl);
    }

    WrapperEl.appendChild(DescIconEl);
    WrapperEl.appendChild(UploadEl);
    WrapperEl.appendChild(DeleteEl);

    // avoid trigger previewer the whole picture
    WrapperEl.addEventListener("click", (e) => e.stopPropagation());

    return WrapperEl;
  }

  /**
   * draw picture desc input
   *
   * @memberof Jiugongge
   */
  _drawDescInputer(index) {
    const WrapperEl = make("div", this.CSS.descPopover);
    const TextareaEl = make("textarea", "", {
      placeholder: "添加描述..",
      value: this._data.items[index].desc || "",
    });

    TextareaEl.addEventListener("input", (e) => {
      this._data.items[index].desc = e.target.value;
    });

    TextareaEl.addEventListener("blur", (e) => {
      const toolbarEl = this.nodes.wrapper.querySelector(
        `[data-toolbar='${index}']`
      );
      toolbarEl.replaceWith(this._drawInlineToolbar(index, e.target.value));
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
  }

  /**
   * draw picture upload options input
   *
   * @memberof Jiugongge
   */
  _drawUploadOptions() {
    const WrapperEl = make("div", this.CSS.uploadPopover);
    const LocalUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "本地上传",
    });

    const LinkUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "图片链接",
    });

    const LinkUploadTextareaEl = make("textarea", this.CSS.uploadPopoverInput, {
      placeholder: "链接地址",
    });

    LinkUploadEl.addEventListener("click", (e) => {
      LinkUploadTextareaEl.style.display = "block";
      LinkUploadTextareaEl.focus();
    });

    LinkUploadTextareaEl.addEventListener("blur", (e) => {
      LinkUploadTextareaEl.style.display = "none";
    });

    WrapperEl.appendChild(LocalUploadEl);
    WrapperEl.appendChild(LinkUploadEl);
    WrapperEl.appendChild(LinkUploadTextareaEl);

    return {
      content: WrapperEl,
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
   *
   * @memberof Jiugongge
   */
  _drawAdder() {
    const AdderEl = make("div", this.CSS.adderBlock);
    const UploadIconEl = make("div", this.CSS.upload, {
      innerHTML: UploadIcon,
    });

    UploadIconEl.addEventListener("click", () => {
      this._addLocalPicture();
    });

    const HintEl = make("div", this.CSS.hint);

    const HintIconEl = make("div", this.CSS.hintIcon, {
      innerHTML: LinkAddIcon,
    });

    const HintTextEl = make("div", this.CSS.hintText, {
      innerHTML: "图片链接",
    });

    HintEl.appendChild(HintIconEl);
    HintEl.appendChild(HintTextEl);

    AdderEl.appendChild(UploadIconEl);
    AdderEl.appendChild(HintEl);

    this.api.tooltip.onHover(HintEl, "通过连接添加图片", { delay: 1000 });

    return AdderEl;
  }
}
