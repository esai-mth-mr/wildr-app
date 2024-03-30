# Tailscale

## Tailscale Setup (One time only)

Install Tailscale from the app store and follow onboarding using your wildr sso

Create a EC2 relay

    assign vpc instance 
    Assign the instance to the public subnet of the VPC, and give it a public IP address.
    In the security groups configuration, allow inbound ssh. (We’ll need this during initial setup, but you can turn it off later.)
    Name the security group something distinctive, like “tailscale-relay”

SSH into the new EC2 relay 

Install Tailscale on EC2 relay 

`curl -fsSL https://tailscale.com/install.sh | sh`

^ this will request you to log in with a magic link

Once installed, enable the Tailscale systemd service, and authenticate the machine to your Tailscale network

`sudo systemctl enable --now tailscaled`

Find all the vpc private links in AWS subnets

`sudo tailscale up --advertise-exit-node --advertise-routes=10.0.0.0/19,10.0.64.0/19,10.0.128.0/19,10.0.32.0/20,10.0.48.0/20,10.0.96.0/20,10.0.112.0/20,10.0.160.0/20,10.0.176.0/20`

on the Tailscale admin console press the hamburger your newly created device 

1. disable key expiry
2. press edit route settings
3. Approve all subnet routes 

VOILÀ your VPN is ready
...

## Connect to Elastic BeanStock

connect your tailscale vpn 

`ssh -i ~/.ssh/wildr-eb-dev-1.key ec2-user@10.0.25.62`
