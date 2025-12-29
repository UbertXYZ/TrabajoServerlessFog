import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { albControllerRole } from "./kubernetes/fogcluster";
import { fogVpc, privateSubnetIds } from "./vpc/fogvpc";
import { k8sProvider } from "./arquitectura/kube_config";
import { fog01Service, fog02Service } from "./arquitectura/services_config";
import "./arquitectura/ingress_config";
new k8s.yaml.ConfigFile(
    "aws-load-balancer-controller",
    {
        file: "./kubernetes/aws-load-balancer-controller.yaml",
        transformations: [
            (obj: any) => {
                if (
                    obj.kind === "ServiceAccount" &&
                    obj.metadata?.name === "aws-load-balancer-controller"
                ) {
                    obj.metadata.annotations = obj.metadata.annotations || {};
                    obj.metadata.annotations["eks.amazonaws.com/role-arn"] =
                        albControllerRole.arn;
                }
            },
        ],
    },
    {
        provider: k8sProvider,
        dependsOn: [albControllerRole],
    }
);
// API Gateway HTTP
const api = new aws.apigatewayv2.Api("fogApi", {
    protocolType: "HTTP",
});

// Security Group para VPC Link
const sg = new aws.ec2.SecurityGroup("vpcLinkSG", {
    vpcId: fogVpc.id,
    ingress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["10.0.0.0/16"] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});

// VPC Link usando subnets privadas
/*
const vpcLink = new aws.apigatewayv2.VpcLink("fogVpcLink", {
    subnetIds: privateSubnetIds, // <-- ahora apunta a subnets privadas
    securityGroupIds: [sg.id],
});
*/
// Función para crear rutas hacia los servicios internos
/*
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
*/
// Rutas hacia servicios
//route("fog01", fog01Service, "/fog01");
//route("fog02", fog02Service, "/fog02");

// Stage por defecto
new aws.apigatewayv2.Stage("default", {
    apiId: api.id,
    name: "$default",
    autoDeploy: true,
});

export const apiUrl = api.apiEndpoint;