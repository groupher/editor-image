import { make } from "@groupher/editor-utils";

// eslint-disable-next-line
import css from "../styles/jiugongge.css";
import UploadIcon from "../icon/upload.svg";
import LinkAddIcon from "../icon/link-add.svg";

import PenIcon from "../icon/pen.svg";
import DeleteIcon from "../icon/delete.svg";
import DownloadIcon from "../icon/download.svg";

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
      toolbarIcon: "image-tool__jiugongge_block_toolbar__icon",

      adderBlock: "image-tool__jiugongge_adder_block",
      upload: "image-tool__jiugongge_adder_block_upload",
      hint: "image-tool__jiugongge_adder_block_hint",
      hintIcon: "image-tool__jiugongge_adder_block_hint__icon",
      hintText: "image-tool__jiugongge_adder_block_hint__text",
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
      const ImageEl = make("img", this.CSS.image, { src: item.src });

      BlockEl.appendChild(ImageEl);
      BlockEl.appendChild(this._drawInlineToolbar());
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
   * draw inline toolbar
   *
   * @memberof Jiugongge
   */
  _drawInlineToolbar() {
    const WrapperEl = make("div", this.CSS.toolbar);

    // 添加说明，更换图片，删除，下载
    const DescIconEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: PenIcon,
    });
    const DownloadEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: DownloadIcon,
    });
    const UploadEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: UploadIcon,
    });
    const DeleteEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: DeleteIcon,
    });

    this.api.tooltip.onHover(DescIconEl, "添加描述", { delay: 500 });
    this.api.tooltip.onHover(DownloadEl, "下载", { delay: 500 });
    this.api.tooltip.onHover(UploadEl, "重新上传", { delay: 500 });
    this.api.tooltip.onHover(DeleteEl, "删除", { delay: 500 });

    WrapperEl.appendChild(DescIconEl);
    WrapperEl.appendChild(DownloadEl);
    WrapperEl.appendChild(UploadEl);
    WrapperEl.appendChild(DeleteEl);
    //
    return WrapperEl;
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
