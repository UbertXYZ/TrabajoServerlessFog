import * as aws from "@pulumi/aws";

const region = aws.getRegionOutput().name;

export const fogVpc = new aws.ec2.Vpc("fogVpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsSupport: true,
  enableDnsHostnames: true,
  tags:{
    Name: "fogVpc",
  },
});

export const subnetA = new aws.ec2.Subnet("fogSubnetA", {
  vpcId: fogVpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: "us-east-1a",
});

export const subnetB = new aws.ec2.Subnet("fogSubnetB", {
  vpcId: fogVpc.id,
  cidrBlock: "10.0.2.0/24",
  availabilityZone: "us-east-1b",
});

export const subnetIds = [subnetA.id, subnetB.id];

const endpointSG = new aws.ec2.SecurityGroup("endpointSG", {
    vpcId: fogVpc.id,
    ingress: [
        {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["10.0.0.0/16"],
        },
    ],
    egress: [
        {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

const services = ["ecr.api", "ecr.dkr", "sts", "logs"];

services.forEach(svc => {
  new aws.ec2.VpcEndpoint(`fog-${svc}`, {
    vpcId: fogVpc.id,
    serviceName: region.apply(r => `com.amazonaws.${r}.${svc}`),
    vpcEndpointType: "Interface",
    subnetIds,
    securityGroupIds: [endpointSG.id],
    privateDnsEnabled: true,
  });
});

const igw = new aws.ec2.InternetGateway("fogIgw", { 
    vpcId: fogVpc.id,
    tags:{
        Name: "fogIgw",
    },
});
const routeTable = new aws.ec2.RouteTable("fogRouteTable", {
    vpcId: fogVpc.id,
    routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
    tags:{
        Name: "fogRouteTable",
    },
});
[new aws.ec2.RouteTableAssociation("fogSubnetAAssoc", { subnetId: subnetA.id, routeTableId: routeTable.id }),
 new aws.ec2.RouteTableAssociation("fogSubnetBAssoc", { subnetId: subnetB.id, routeTableId: routeTable.id })];
