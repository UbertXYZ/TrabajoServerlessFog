import "./arquitectura/ecr_config";
import { fog01Service, fog02Service } from "./arquitectura/services_config";

export const fog01Url = fog01Service.status.loadBalancer.ingress[0].hostname;
export const fog02Url = fog02Service.status.loadBalancer.ingress[0].hostname;