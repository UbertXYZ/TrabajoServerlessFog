import * as aws from "@pulumi/aws";
const region = aws.getRegionOutput().name;

export const fogVpc = new aws.ec2.Vpc("fogVpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsSupport: true,
    enableDnsHostnames: true,
    tags: { Name: "fogVpc" },
});

export const publicSubnetA = new aws.ec2.Subnet("fogPublicSubnetA", {
    vpcId: fogVpc.id,
    cidrBlock: "10.0.10.0/24",
    availabilityZone: "us-east-1a",
    tags: {
        Name: "fogPublicSubnetA",
        "kubernetes.io/role/elb": "1",
     },
});
export const publicSubnetB = new aws.ec2.Subnet("fogPublicSubnetB", {
    vpcId: fogVpc.id,
    cidrBlock: "10.0.11.0/24",
    availabilityZone: "us-east-1b",
    tags: {
        Name: "fogPublicSubnetB",
        "kubernetes.io/role/elb": "1",
     },
});
export const privateSubnetA = new aws.ec2.Subnet("fogPrivateSubnetA", {
    vpcId: fogVpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    tags: {
        Name: "fogPrivateSubnetA",
    },
});

export const privateSubnetB = new aws.ec2.Subnet("fogPrivateSubnetB", {
    vpcId: fogVpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    tags: {
        Name: "fogPrivateSubnetB",
    },
});

const igw = new aws.ec2.InternetGateway("fogIgw", { 
    vpcId: fogVpc.id,
    tags: { Name: "fogIgw" },
});
const publicRouteTable = new aws.ec2.RouteTable("fogPublicRouteTable", {
    vpcId: fogVpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
    tags: { Name: "fogPublicRouteTable" },
});

[publicSubnetA, publicSubnetB].forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`fogPublicRta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    });
});

const eip = new aws.ec2.Eip("fogNatEip", {
    tags: { Name: "fogNatEip" },
});
const natGateway = new aws.ec2.NatGateway("fogNatGw", {
    subnetId: publicSubnetA.id,
    allocationId: eip.id,
    tags: { Name: "fogNatGw" },
});
const privateRouteTable = new aws.ec2.RouteTable("fogPrivateRouteTable", {
    vpcId: fogVpc.id,
    tags: { Name: "fogPrivateRouteTable" },
});
[new aws.ec2.Route("privateDefaultRoute", {
    routeTableId: privateRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    natGatewayId: natGateway.id,
})];
[privateSubnetA, privateSubnetB].forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`fogPrivateRta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
    });
});
const endpointSG = new aws.ec2.SecurityGroup("endpointSG", {
    vpcId: fogVpc.id,
    ingress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["10.0.0.0/16"] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});
export const privateSubnetIds = [privateSubnetA.id, privateSubnetB.id];
export const publicSubnetIds = [publicSubnetA.id, publicSubnetB.id];
const services = ["ecr.api", "ecr.dkr", "sts", "logs"];
services.forEach(svc => {
    new aws.ec2.VpcEndpoint(`fog-${svc}`, {
        vpcId: fogVpc.id,
        serviceName: region.apply(r => `com.amazonaws.${r}.${svc}`),
        vpcEndpointType: "Interface",
        subnetIds: privateSubnetIds,
        securityGroupIds: [endpointSG.id],
        privateDnsEnabled: true,
    });
});