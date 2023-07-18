/* @refresh reload */
import { render } from "solid-js/web";
import "@unocss/reset/tailwind-compat.css";
import "uno.css";
import "./index.less";

import App from "./App";

const root = document.getElementById("root");

render(() => <App />, root!);
