import $ from "jquery";
import select2Factory from "select2";
import "select2/dist/css/select2.min.css";
import "sweetalert2/dist/sweetalert2.min.css";

export function installUiLibs(app) {
    if (typeof window !== "undefined") {
        window.$ = window.jQuery = $;
        if (!$.fn.select2) {
            select2Factory(window, $);
        }
    }
}
