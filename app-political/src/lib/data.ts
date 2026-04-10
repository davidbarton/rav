import type { Report } from "./types";
import reportJson from "../../data/report.json";

export const report = reportJson as unknown as Report;
