import type { Report } from "./types";
import reportJson from "../../data/dior-report.json";

export const report = reportJson as unknown as Report;
