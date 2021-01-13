import { make } from "@groupher/editor-utils";

// eslint-disable-next-line
import css from "../styles/jiugongge.css";
import PlusIcon from "../icon/plus.svg";
import LinkAddIcon from "../icon/link-add.svg";

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
  constructor({ api }) {
    this.api = api;

    this.nodes = {
      wrapper: null,
    };
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

      adderBlock: "image-tool__jiugongge_adder_block",
      plus: "image-tool__jiugongge_adder_block_plus",
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
    this.nodes.wrapper = make("div", this.CSS.wrapper);

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const BlockEl = make("div", this.CSS.block);
      const ImageEl = make("img", this.CSS.image, { src: item.src });

      BlockEl.appendChild(ImageEl);
      this.nodes.wrapper.appendChild(BlockEl);
    }

    // add adder if needed
    if (data.items.length < 9) {
      this.nodes.wrapper.appendChild(this._makeAdder());
    }

    return this.nodes.wrapper;
  }

  /**
   * make adder block
   *
   * @memberof Jiugongge
   */
  _makeAdder() {
    const AdderEl = make("div", this.CSS.adderBlock);
    const PlusIconEl = make("div", this.CSS.plus, {
      innerHTML: PlusIcon,
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

    AdderEl.appendChild(PlusIconEl);
    AdderEl.appendChild(HintEl);

    this.api.tooltip.onHover(HintEl, "通过连接添加图片", { delay: 1000 });

    return AdderEl;
  }
}
