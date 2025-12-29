import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { fogVpc, subnetIds } from "./vpc/fogvpc";
import { fog01Service, fog02Service } from "./arquitectura/services_config";
//import "./arquitectura/ingress_config";

const api = new aws.apigatewayv2.Api("fogApi", {
  protocolType: "HTTP",
});

const sg = new aws.ec2.SecurityGroup("vpcLinkSG", {
  vpcId: fogVpc.id,
  ingress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["10.0.0.0/16"] }],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});

const vpcLink = new aws.apigatewayv2.VpcLink("fogVpcLink", {
  subnetIds,
  securityGroupIds: [sg.id],
});

function route(name: string, svc: any, path: string) {
  const uri = svc.status.loadBalancer.ingress[0].hostname;

  const integ = new aws.apigatewayv2.Integration(name, {
    apiId: api.id,
    integrationType: "HTTP_PROXY",
    integrationUri: pulumi.interpolate`http://${uri}:80`,
    integrationMethod: "POST",
    connectionType: "VPC_LINK",
    connectionId: vpcLink.id,
  });

  new aws.apigatewayv2.Route(`${name}-route`, {
    apiId: api.id,
    routeKey: `POST ${path}`,
    target: pulumi.interpolate`integrations/${integ.id}`,
  });
}

route("fog01", fog01Service, "/fog01");
route("fog02", fog02Service, "/fog02");

new aws.apigatewayv2.Stage("default", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
});

export const apiUrl = api.apiEndpoint;