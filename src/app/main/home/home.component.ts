import {Component, OnInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import {FuseConfigService} from '@fuse/services/config';
import {HttpService} from '../../shared/services/http.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {FuseScrollbarDirective} from '@fuse/directives/scrollbar/scrollbar.directive';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../shared/components/confirm-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';

declare const gtag: Function;

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {

    @ViewChild(FuseScrollbarDirective) private fuseBar: FuseScrollbarDirective;

    config: any;
    loginSubscription: Subscription;
    action: string = 'none';
    isLoggedIn: boolean = false;
    plan: string = 'standard';
    cdpURL: any;

    constructor(private _fuseConfigService: FuseConfigService,
                private httpService: HttpService,
                private activatedRoute: ActivatedRoute,
                private router: Router,
                public dialog: MatDialog,
                private _sanitizer: DomSanitizer
    ) {
        if (!this.httpService.loggedIn) {
            this.setLoggedInView(false);
        } else {
            this.isLoggedIn = true;
        }
    }

    ngOnInit(): void {

        this.cdpURL = this._sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/dKqG8h8o-0w');

        // Subscribe to config change
        this._fuseConfigService.config$
            .subscribe((config) => {
                this.config = config;
            });

        this.loginSubscription = this.httpService.getLoggedInState().subscribe(status => {
            this.setLoggedInView(status.state);
        });
        this.activatedRoute.queryParams.subscribe((param: any) => {
            if (param['login'] !== undefined) {
                this.action = 'login';
            }
        });
        if (this.isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.loginSubscription.unsubscribe();
    }

    protected setLoggedInView(isLoggedIn: boolean): void {
        this.isLoggedIn = isLoggedIn;
        if (isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

    public gotoPricing(event): void {
        this.router.navigate(['/pricing']);
    }

    public gotoRegister(event): void {
        this.router.navigate(['/signup']);
    }

    public gotoEbook(): void {
        this.fuseBar.scrollToElement('#features', 0, false, 1000);
    }

    public gotoFAQ(): void {
        this.fuseBar.scrollToElement('#faq', 0, false, 1000);
    }

    public toggleLogin(event): void {
        if (this.action === 'login') {
            this.action = 'none';
        } else {
            this.action = 'login';
        }
        event.stopPropagation();
    }

    public privacy(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                title: 'Privacy Policy',
                confirmMessage: '[Last updated October 1st, 2022]',
                informationMessage: '',
                rawHtml:
                    'Thank you for choosing to work with Dymazoo Ltd (“company”, “we”, “us”, or “our”). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at contact@dymazoo.com<br/>' +
                    '<br/>' +
                    'When you visit our Site https://www.dymazoo.com (“Site”) and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy notice, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it and what rights you have in relation to it. We hope you take some time to read through it carefully, as it is important. If there are any terms in this privacy policy that you do not agree with, please discontinue use of our site and our services.<br/>' +
                    '<br/>' +
                    'This privacy policy applies to all information collected through our Site and/or any related services, sales, marketing or events (we refer to them collectively in this privacy policy as the “Site“).  <br/>' +
                    '<br/>' +
                    'Please read this privacy policy carefully as it will help you make informed decisions about sharing your personal information with us.  <br/>' +
                    '<br/>' +
                    'WHAT INFORMATION DO WE COLLECT?<br/>' +
                    'Personal information you disclose to us<br/>' +
                    'In Short: We collect personal information that you provide to us such as name, address, contact information, passwords and security data and payment information.<br/>' +
                    '<br/>' +
                    'We collect personal information that you voluntarily provide to us when registering with Dymazoo, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Site or otherwise contacting us.<br/>' +
                    '<br/>' +
                    'The personal information that we collect depends on the context of your interactions with us and the Site, the choices you make and the products and features you use. The personal information we collect can include the following:<br/>' +
                    '<br/>' +
                    'Name and Contact Data. We collect your first and last name, email address, postal address, phone number, and other similar contact data.<br/>' +
                    '<br/>' +
                    'Credentials. We collect passwords, password hints, and similar security information used for authentication and account access.<br/>' +
                    '<br/>' +
                    'Payment Data. We collect data necessary to process your payment if you make purchases, such as your payment instrument number (such as a credit card number), and the security code associated with your payment instrument. All payment data is stored by our payment processor and you should review its privacy policies and contact the <a href="https://stripe.com/privacy" target="_blank">payment processor</a> directly to respond to your questions.<br/>' +
                    '<br/>' +
                    'All personal information that you provide to us must be true, complete and accurate, and you must notify us of any changes to such personal information.  <br/>' +
                    '<br/>' +
                    'Information automatically collected<br/>' +
                    'In Short: Some information – such as IP address and/or browser and device characteristics – is collected automatically when you visit our Site.<br/>' +
                    '<br/>' +
                    'We automatically collect certain information when you visit, use or navigate the Site. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Site and other technical information.  If you access our site with your mobile device, we may automatically collect device information (such as your mobile device ID, model and manufacturer), operating system, version information and IP address.This information is primarily needed to maintain the security and operation of our Site, and for our internal analytics and reporting purposes.<br/>' +
                    '<br/>' +
                    'Like many businesses, we also collect information through cookies and similar technologies. You can find out more about this in our Cookie Policy.<br/>' +
                    '<br/>' +
                    'HOW DO WE USE YOUR INFORMATION?<br/>' +
                    'In Short: We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.<br/>' +
                    '<br/>' +
                    'We use personal information collected via our Site for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests (“Business Purposes”), in order to enter into or perform a contract with you (“Contractual”), with your consent (“Consent”), and/or for compliance with our legal obligations (“Legal Reasons”). We indicate the specific processing grounds we rely on next to each purpose listed below.  <br/>' +
                    '<br/>' +
                    'We use the information we collect or receive:  <br/>' +
                    '<br/>' +
                    'To facilitate account creation and logon process with your Consent. <br/>' +
                    'To send you marketing and promotional communications for Business Purposes and/or with your Consent. We may use the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt-out of our marketing emails at any time.<br/>' +
                    'To send administrative information to you for related to your account, our business purposes, and/or for legal reasons. We may use your personal information to send you product, service and new feature information and/or information about changes to our terms, conditions, and policies.<br/>' +
                    'Fulfill and manage your orders for Contractual reasons. We may use your information to fulfill and manage your orders, payments, returns, and exchanges made through the Site.<br/>' +
                    'To post testimonials with your Consent. We post testimonials on our Site that may contain personal information. Prior to posting a testimonial, we will obtain your consent to use your name and testimonial. If you wish to update, or delete your testimonial, please contact us at contact@dymazoo.com and be sure to include your name, testimonial location, and contact information.<br/>' +
                    'Deliver targeted advertising to you for our Business Purposes and/or with your Consent. We may use your information to develop and display content and advertising tailored to your interests and/or location and to measure its effectiveness.<br/>' +
                    'Request Feedback for our Business Purposes and/or with your Consent. We may use your information to request feedback and to contact you about your use of our Site.<br/>' +
                    'To protect our Site for Business Purposes and/or Legal Reasons.  We may use your information as part of our efforts to keep our Site safe and secure (for example, for fraud monitoring and prevention).<br/>' +
                    'To enable user-to-user communications with your consent. We may use your information in order to enable user-to-user communications with each user’s consent.<br/>' +
                    'To enforce our terms, conditions and policies for our business purposes and as legally required.<br/>' +
                    'To respond to legal requests and prevent harm as legally required. If we receive a subpoena or other legal request, we may need to inspect the data we hold to determine how to respond.<br/>' +
                    'For other Business Purposes. We may use your information for other Business Purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Site, products, services, marketing and your experience.<br/>' +
                    'If you choose to link your account with us to a third party account (such as MailChimp, SendinBlue, Shopify or EventBrite), we use the information you allowed us to collect from those third parties to facilitate the supply the service.<br/>' +
                    '<br/>' +
                    'WILL YOUR INFORMATION BE SHARED WITH ANYONE?<br/>' +
                    'In Short: We only share information with your consent, to comply with laws, to protect your rights, or to fulfill business obligations.<br/>' +
                    '<br/>' +
                    'We only share and disclose your information in the following situations:<br/>' +
                    '<br/>' +
                    'Compliance with Laws. We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process, such as in response to a court order or a subpoena (including in response to public authorities to meet national security or law enforcement requirements).<br/>' +
                    'Vital Interests and Legal Rights. We may disclose your information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, situations involving potential threats to the safety of any person and illegal activities, or as evidence in litigation in which we are involved.<br/>' +
                    'Vendors, Consultants and Other Third-Party Service Providers. We may share your data with third party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing, data analysis, email delivery, hosting services, customer service and marketing efforts. We may allow selected third parties to use tracking technology on the Site, which will enable them to collect data about how you interact with the Site over time.  This information may be used to, among other things, analyze and track data, determine the popularity of certain content and better understand online activity. Unless described in this Policy, we do not share, sell, rent or trade any of your information with third parties for their promotional purposes.<br/>' +
                    'Business Transfers. We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.<br/>' +
                    'Business Partners. We may share your information with our business partners to offer you certain products, services or promotions, such as payment peocessing.<br/>' +
                    'With your Consent. We may disclose your personal information for any other purpose with your consent.<br/>' +
                    '<br/>' +
                    'DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?<br/>' +
                    'In Short: We may use cookies and other tracking technologies to collect and store your information.<br/>' +
                    '<br/>' +
                    'We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.<br/>' +
                    '<br/>' +
                    'IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?<br/>' +
                    'In Short: We mainly transfer, store, and process your information in the United Kingdom. If you have made purchases from us, we transfer data necessary to process your payment to our payment processor, who is based in the United States. If you have linked your account to a third party, who may be outside the United Kingdom, you consent to your information being transfered to and/or from that third party.<br/>' +
                    '<br/>' +
                    'Our servers are located in the United Kingdom. If you are accessing our Site from outside the United Kingdom, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information (see “Will Your Information Be Shared With Anyone?” above), in the United Kingdom.<br/>' +
                    '<br/>' +
                    'If you are a resident in the European Economic Area, then these countries may not have data protection or other laws as comprehensive as those in your country. We will however take all necessary measures to protect your personal information in accordance with this privacy policy and applicable law.<br/>' +
                    '<br/>' +
                    'HOW LONG DO WE KEEP YOUR INFORMATION?<br/>' +
                    'In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law.<br/>' +
                    '<br/>' +
                    'We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements). No purpose in this policy will require us keeping your personal information for longer than 90 days past the termination of your account.<br/>' +
                    '<br/>' +
                    'When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.<br/>' +
                    '<br/>' +
                    'HOW DO WE KEEP YOUR INFORMATION SAFE?<br/>' +
                    'In Short: We aim to protect your personal information through a system of organizational and technical security measures.<br/>' +
                    '<br/>' +
                    'We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of any personal information to and from our Site is at your own risk. You should only access the services within a secure environment.<br/>' +
                    '<br/>' +
                    'DO WE COLLECT INFORMATION FROM MINORS?<br/>' +
                    'In Short: We do not knowingly collect data from or market to children under 18 years of age.<br/>' +
                    '<br/>' +
                    'We do not knowingly solicit data from or market to children under 18 years of age.  By using the Site, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Site.  If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.  If you become aware of any data we have collected from children under age 18, please contact us at contact@dymazoo.com<br/>' +
                    '<br/>' +
                    'WHAT ARE YOUR PRIVACY RIGHTS?<br/>' +
                    'In Short: Dymazoo cares about your privacy rights. We allow users to review, change, or terminate your account at any time.<br/>' +
                    '<br/>' +
                    'Account Information<br/>' +
                    'You may at any time review or change the information in your account or terminate your account by:<br/>' +
                    '<br/>' +
                    'Logging into your account settings and updating your account<br/>' +
                    'Contacting us using the contact information provided below<br/>' +
                    'Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Use and/or comply with legal requirements.<br/>' +
                    '<br/>' +
                    'Cookies and similar technologies: Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Site.<br/>' +
                    '<br/>' +
                    'Opting out of email marketing: You can unsubscribe from our marketing email list at any time by clicking on the unsubscribe link in the emails that we send or by contacting us using the details provided below. You will then be removed from the marketing email list – however, we will still need to send you service-related emails that are necessary for the administration and use of your account.<br/>' +
                    '<br/>' +
                    'DO WE RESPOND TO DO-NOT-TRACK SIGNALS?<br/>' +
                    'Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (“DNT”) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. No uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Policy.<br/>' +
                    '<br/>' +
                    'DO WE MAKE UPDATES TO THIS POLICY?<br/>' +
                    'In Short: Yes, we will update this policy as necessary to stay compliant with relevant laws.<br/>' +
                    '<br/>' +
                    'We may update this privacy policy from time to time. The updated version will be indicated by an updated “Revised” date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy policy, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.<br/>' +
                    '<br/>' +
                    'HOW CAN YOU CONTACT US ABOUT THIS POLICY?<br/>' +
                    'If you have questions or comments about this policy, email us at contact@dymazoo.com or by post to:<br/>' +
                    '<br/>' +
                    'Dymazoo Ltd<br/>' +
                    'OFFICES A13-A14 CHAMPIONS BUSINESS PARK <br/>' +
                    'ARROWE BROOK ROAD <br/>' +
                    'WIRRAL <br/>' +
                    'ENGLAND <br/>' +
                    'CH49 0AB ',
                buttons: 'close2'
            }
        });
    }

    public terms(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                title: 'Agreement to Terms',
                confirmMessage: '[Last updated October 1st, 2022]',
                informationMessage: '',
                rawHtml:
                    'These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Dymazoo Ltd (“we,” “us” or “our”), concerning your access to and use of the https://www.dymazoo.com Site as well as any other media form, media channel, mobile Site or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”). You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Use. If you do not agree with all of these terms of use, then you are expressly prohibited from using the site and you must discontinue use immediately.<br/>' +
                    '<br/>' +
                    'Supplemental terms and conditions or documents that may be posted on the Site from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Use at any time and for any reason. We will alert you about any changes by updating the “Last updated” date of these Terms of Use, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms of Use to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Terms of Use by your continued use of the Site after the date such revised Terms of Use are posted.<br/>' +
                    '<br/>' +
                    'The information provided on the Site is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Site from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.<br/>' +
                    '<br/>' +
                    'The Site is intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Site.<br/>' +
                    '<br/>' +
                    'ACCEPTABLE USE<br/>' +
                    'You are solely responsible for your conduct and your data related to the Service.<br/>' +
                    'You agree to indemnify, defend and hold harmless Dymazoo Ltd and its suppliers for any loss, cost, liability, and expense arising from or related to your data, your use of the Service, or your violation of these terms.<br/>' +
                    'The Software and Service are made available to you, your company, and/or your customers only for personal or commercial use, which use must be in compliance with all applicable laws, rules and regulations and must not infringe or violate third party rights.<br/>' +
                    'Any unauthorized use of any Dymazoo Service is a violation of this Agreement and certain laws. Such violations may subject the unauthorized user and his or her agents to civil and crimnal penalties.<br/>' +
                    '<br/>' +
                    'INTELLECTUAL PROPERTY RIGHTS<br/>' +
                    'Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, Site designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the United Kingdom, foreign jurisdictions, and international conventions. The Content and the Marks are provided on the Site “AS IS” for your information and personal and commercial use only. Except as expressly provided in these Terms of Use, no part of the Site and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.<br/>' +
                    '<br/>' +
                    'Provided that you are eligible to use the Site, you are granted a limited license to access and use the Site to which you have properly gained access. We reserve all rights not expressly granted to you in and to the Site, the Content and the Marks.<br/>' +
                    '<br/>' +
                    'USER REPRESENTATIONS<br/>' +
                    'By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Use; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Site through automated or non-human means, other than as provided by us, whether through a bot, script or otherwise; (6) you will not use the Site for any illegal or unauthorized purpose; and (7) your use of the Site will not violate any applicable law or regulation.<br/>' +
                    '<br/>' +
                    'If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Site (or any portion thereof).<br/>' +
                    '<br/>' +
                    'USER REGISTRATION<br/>' +
                    'You are required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.<br/>' +
                    '<br/>' +
                    'FEES AND PAYMENT<br/>' +
                    'We accept the following forms of payment: Major credit cards such as Visa & Mastercard.<br/>' +
                    'You may be required to purchase or pay a fee to access some of our services. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed.  We bill you through an online billing account for purchases made via the Site. We may change prices at any time. All payments shall be in US Dollars.<br/>' +
                    '<br/>' +
                    'You agree to pay all charges or fees at the prices then in effect for your purchases, and you authorize us to charge your chosen payment provider for any such amounts upon making your purchase. If your purchase is subject to recurring charges, then you consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until you notify us of your cancellation. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment. We also reserve the right to refuse any order placed through the Site.<br/>' +
                    '<br/>' +
                    'OUR FEES<br/>' +
                    'When registering with Dymazoo, you will need to select a plan that fits your needs. We offer a variety of plans, all available on the sign up page above. Users who previously created accounts and have prior plans with us are able to continue using their prior payment method. Any upgrades will occur immediately at a prorated rate. Any downgrades to a user’s account will take place following the end of their current payment term.<br/>' +
                    '<br/>' +
                    'CANCELLATION<br/>' +
                    'You can cancel your subscription at any time by logging into your account or contacting us using the contact information provided below. Your cancellation will take effect at the end of the current payment term. All Site and policy info will be deleted upon the end of the subscription.<br/>' +
                    '<br/>' +
                    'If you are unsatisfied with our services, please email us at contact@dymazoo.com.<br/>' +
                    '<br/>' +
                    'PROHIBITED ACTIVITIES<br/>' +
                    'You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.<br/>' +
                    '<br/>' +
                    'As a user of the Site, you agree not to:<br/>' +
                    '<br/>' +
                    'Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.<br/>' +
                    'Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.<br/>' +
                    'Use a buying agent or purchasing agent to make purchases on the Site.<br/>' +
                    'Use the Site to advertise or offer to sell goods and services.<br/>' +
                    'Circumvent, disable, or otherwise interfere with security-related features of the Site, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Site and/or the Content contained therein.<br/>' +
                    'Engage in unauthorized framing of or linking to the Site.<br/>' +
                    'Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.<br/>' +
                    'Make improper use of our support services or submit false reports of abuse or misconduct.<br/>' +
                    'Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.<br/>' +
                    'Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.<br/>' +
                    'Attempt to impersonate another user or person or use the username of another user.<br/>' +
                    'Sell or otherwise transfer your profile.<br/>' +
                    'Use any information obtained from the Site in order to harass, abuse, or harm another person.<br/>' +
                    'Use the Site as part of any effort to compete with us or otherwise use the Site and/or the Content for any revenue-generating endeavor or commercial enterprise.<br/>' +
                    'Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Site.<br/>' +
                    'Attempt to bypass any measures of the Site designed to prevent or restrict access to the Site, or any portion of the Site.<br/>' +
                    'Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Site to you.<br/>' +
                    'Delete the copyright or other proprietary rights notice from any Content.<br/>' +
                    'Copy or adapt the Site’s software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.<br/>' +
                    'Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party’s uninterrupted use and enjoyment of the Site or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Site.<br/>' +
                    'Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats (“gifs”), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as “spyware” or “passive collection mechanisms” or “pcms”).<br/>' +
                    'Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Site, or using or launching any unauthorized script or other software.<br/>' +
                    'Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site.<br/>' +
                    'Use the Site in a manner inconsistent with any applicable laws or regulations.<br/>' +
                    'USER GENERATED CONTRIBUTIONS<br/>' +
                    'The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, “Contributions”). Contributions may be viewable by other users of the Site and through third-party Sites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary. When you create or make available any Contributions, you thereby represent and warrant that:<br/>' +
                    '<br/>' +
                    'The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.<br/>' +
                    '<br/>' +
                    'You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Site, and other users of the Site to use your Contributions in any manner contemplated by the Site and these Terms of Use.<br/>' +
                    'You have the written consent, release, and/or permission of each and every identifiable individual person in your Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of your Contributions in any manner contemplated by the Site and these Terms of Use.<br/>' +
                    'Your Contributions are not false, inaccurate, or misleading.<br/>' +
                    'Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.<br/>' +
                    'Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).<br/>' +
                    'Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.<br/>' +
                    'Your Contributions do not advocate the violent overthrow of any government or incite, encourage, or threaten physical harm against another.<br/>' +
                    'Your Contributions do not violate any applicable law, regulation, or rule.<br/>' +
                    'Your Contributions do not violate the privacy or publicity rights of any third party.<br/>' +
                    'Your Contributions do not contain any material that solicits personal information from anyone under the age of 18 or exploits people under the age of 18 in a sexual or violent manner.<br/>' +
                    'Your Contributions do not violate any federal or state law concerning child pornography, or otherwise intended to protect the health or well-being of minors;<br/>' +
                    'Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.<br/>' +
                    'Your Contributions do not otherwise violate, or link to material that violates, any provision of these Terms of Use, or any applicable law or regulation.<br/>' +
                    'Any use of the Site in violation of the foregoing violates these Terms of Use and may result in, among other things, termination or suspension of your rights to use the Site.<br/>' +
                    '<br/>' +
                    'CONTRIBUTION LICENSE<br/>' +
                    'By posting your Contributions to any part of the Site, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions (including, without limitation, your image and voice) for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of, or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing. The use and distribution may occur in any media formats and through any media channels.<br/>' +
                    '<br/>' +
                    'This license will apply to any form, media, or technology now known or hereafter developed, and includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial images you provide. You waive all moral rights in your Contributions, and you warrant that moral rights have not otherwise been asserted in your Contributions.<br/>' +
                    '<br/>' +
                    'We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Site. You are solely responsible for your Contributions to the Site and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.<br/>' +
                    '<br/>' +
                    'We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise change any Contributions; (2) to re-categorize any Contributions to place them in more appropriate locations on the Site; and (3) to pre-screen or delete any Contributions at any time and for any reason, without notice. We have no obligation to monitor your Contributions.<br/>' +
                    '<br/>' +
                    'SUBMISSIONS<br/>' +
                    'You acknowledge and agree that any questions, comments, suggestions, ideas, feedback, or other information regarding the Site (“Submissions”) provided by you to us are non-confidential and shall become our sole property. We shall own exclusive rights, including all intellectual property rights, and shall be entitled to the unrestricted use and dissemination of these Submissions for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you. You hereby waive all moral rights to any such Submissions, and you hereby warrant that any such Submissions are original with you or that you have the right to submit such Submissions. You agree there shall be no recourse against us for any alleged or actual infringement or misappropriation of any proprietary right in your Submissions.<br/>' +
                    '<br/>' +
                    'SITE MANAGEMENT<br/>' +
                    'We reserve the right, but not the obligation, to: (1) monitor the Site for violations of these Terms of Use; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Use, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Site or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site.<br/>' +
                    '<br/>' +
                    'DIGITAL MILLENNIUM COPYRIGHT ACT (DMCA) NOTICE AND POLICY<br/>' +
                    'Notifications<br/>' +
                    'We respect the intellectual property rights of others. If you believe that any material available on or through the Site infringes upon any copyright you own or control, please immediately notify our Designated Copyright Agent using the contact information provided below (a “Notification”). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to federal law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Site infringes your copyright, you should consider first contacting an attorney.<br/>' +
                    '<br/>' +
                    'All Notifications should meet the requirements of DMCA 17 U.S.C. § 512(c)(3) and include the following information: (1) A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed; (2) identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works on the Site are covered by the Notification, a representative list of such works on the Site; (3) identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material; (4) information reasonably sufficient to permit us to contact the complaining party, such as an address, telephone number, and, if available, an email address at which the complaining party may be contacted; (5) a statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law; and (6) a statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed upon.<br/>' +
                    '<br/>' +
                    'Counter Notification<br/>' +
                    'If you believe your own copyrighted material has been removed from the Site as a result of a mistake or misidentification, you may submit a written counter notification to [us/our Designated Copyright Agent] using the contact information provided below (a “Counter Notification”). To be an effective Counter Notification under the DMCA, your Counter Notification must include substantially the following: (1) identification of the material that has been removed or disabled and the location at which the material appeared before it was removed or disabled; (2) a statement that you consent to the jurisdiction of the Federal District Court in which your address is located, or if your address is outside the United Kingdom, for any judicial district in which we are located; (3) a statement that you will accept service of process from the party that filed the Notification or the party’s agent; (4) your name, address, and telephone number; (5) a statement under penalty of perjury that you have a good faith belief that the material in question was removed or disabled as a result of a mistake or misidentification of the material to be removed or disabled; and (6) your physical or electronic signature.<br/>' +
                    '<br/>' +
                    'If you send us a valid, written Counter Notification meeting the requirements described above, we will restore your removed or disabled material, unless we first receive notice from the party filing the Notification informing us that such party has filed a court action to restrain you from engaging in infringing activity related to the material in question. Please note that if you materially misrepresent that the disabled or removed content was removed by mistake or misidentification, you may be liable for damages, including costs and attorney’s fees. Filing a false Counter Notification constitutes perjury.<br/>' +
                    '<br/>' +
                    'Designated Copyright Agent<br/>' +
                    'Dymazoo Ltd<br/>' +
                    '<br/>' +
                    'Attn: Copyright Agent<br/>' +
                    '<br/>' +
                    'OFFICES A13-A14 CHAMPIONS BUSINESS PARK <br/>' +
                    'ARROWE BROOK ROAD <br/>' +
                    'WIRRAL <br/>' +
                    'ENGLAND <br/>' +
                    'CH49 0AB <br/>' +
                    '<br/>' +
                    'TERM AND TERMINATION<br/>' +
                    'These Terms of Use shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF USE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OF USE OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SITE OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.<br/>' +
                    '<br/>' +
                    'If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.<br/>' +
                    '<br/>' +
                    'MODIFICATIONS AND INTERRUPTIONS<br/>' +
                    'We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.<br/>' +
                    '<br/>' +
                    'We cannot guarantee the Site will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Site, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Site at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Site during any downtime or discontinuance of the Site. Nothing in these Terms of Use will be construed to obligate us to maintain and support the Site or to supply any corrections, updates, or releases in connection therewith.<br/>' +
                    '<br/>' +
                    'GOVERNING LAW<br/>' +
                    'These Terms of Use and your use of the Site are governed by and construed in accordance with the laws of the United Kingdom applicable to agreements made and to be entirely performed within the United Kingdom, without regard to its conflict of law principles.<br/>' +
                    '<br/>' +
                    'DISPUTE RESOLUTION<br/>' +
                    'Informal Negotiations<br/>' +
                    'To expedite resolution and control the cost of any dispute, controversy, or claim related to these Terms of Use (each a “Dispute” and collectively, the “Disputes”) brought by either you or us (individually, a “Party” and collectively, the “Parties”), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.<br/>' +
                    '<br/>' +
                    'Binding Arbitration<br/>' +
                    'If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute (except those Disputes expressly excluded below) will be finally and exclusively resolved by binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION, YOU WOULD HAVE THE RIGHT TO SUE IN COURT. The arbitration shall be commenced and conducted under the Arbitration Act 1996. Your arbitration fees and your share of arbitrator compensation shall be governed by the Arbitration Act 1996. If such costs are determined to by the arbitrator to be excessive, we will pay all arbitration fees and expenses. The arbitration may be conducted in person, through the submission of documents, by phone, or online. The arbitrator will make a decision in writing, but need not provide a statement of reasons unless requested by either Party. The arbitrator must follow applicable law, and any award may be challenged if the arbitrator fails to do so. Except where otherwise required by the applicable Arbitration Act 1996 rules or applicable law, the arbitration will take place in Brighton, England. Except as otherwise provided herein, the Parties may litigate in court to compel arbitration, stay proceedings pending arbitration, or to confirm, modify, vacate, or enter judgment on the award entered by the arbitrator.<br/>' +
                    '<br/>' +
                    'If for any reason, a Dispute proceeds in court rather than arbitration, the Dispute shall be commenced or prosecuted in the courts located in England, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction, and forum non conveniens with respect to venue and jurisdiction in such courts. Application of the United Nations Convention on Contracts for the International Sale of Goods and the the Uniform Computer Information Transaction Act (UCITA) are excluded from these Terms of Use.<br/>' +
                    '<br/>' +
                    'In no event shall any Dispute brought by either Party related in any way to the Site be commenced more than one (1) years after the cause of action arose. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction of that court.<br/>' +
                    '<br/>' +
                    'Restrictions<br/>' +
                    'The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.<br/>' +
                    '<br/>' +
                    'Exceptions to Informal Negotiations and Arbitration<br/>' +
                    'The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations and binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction of that court.<br/>' +
                    '<br/>' +
                    'CORRECTIONS<br/>' +
                    'There may be information on the Site that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Site at any time, without prior notice.<br/>' +
                    '<br/>' +
                    'DISCLAIMER<br/>' +
                    'THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SITE’S CONTENT OR THE CONTENT OF ANY SiteS LINKED TO THE SITE AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SITE, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SITE, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SITE BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SITE. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SITE, ANY HYPERLINKED Site, OR ANY Site OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.<br/>' +
                    '<br/>' +
                    'LIMITATIONS OF LIABILITY<br/>' +
                    'IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN STATE LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.<br/>' +
                    '<br/>' +
                    'INDEMNIFICATION<br/>' +
                    'You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys’ fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Site; (3) breach of these Terms of Use; (4) any breach of your representations and warranties set forth in these Terms of Use; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Site with whom you connected via the Site. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.<br/>' +
                    '<br/>' +
                    'USER DATA<br/>' +
                    'We will maintain certain data that you transmit to the Site for the purpose of managing the performance of the Site, as well as data relating to your use of the Site. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Site. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.<br/>' +
                    '<br/>' +
                    'ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES<br/>' +
                    'Visiting the Site, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SITE. You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.<br/>' +
                    '<br/>' +
                    'MISCELLANEOUS<br/>' +
                    'These Terms of Use and any policies or operating rules posted by us on the Site or in respect to the Site constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms of Use shall not operate as a waiver of such right or provision. These Terms of Use operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Terms of Use is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Terms of Use and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Terms of Use or use of the Site. You agree that these Terms of Use will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Terms of Use and the lack of signing by the parties hereto to execute these Terms of Use.<br/>' +
                    '<br/>' +
                    'CONTACT US<br/>' +
                    'In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:<br/>' +
                    '<br/>' +
                    'Dymazoo Ltd<br/>' +
                    'OFFICES A13-A14 CHAMPIONS BUSINESS PARK <br/>' +
                    'ARROWE BROOK ROAD <br/>' +
                    'WIRRAL <br/>' +
                    'ENGLAND <br/>' +
                    'CH49 0AB ',
                buttons: 'close2'
            }
        });
    }

    public cookies(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                title: 'Cookie Policy',
                confirmMessage: '[Last updated October 1st, 2022]',
                informationMessage: '',
                rawHtml:
                    'This Cookie Policy explains how Dymazoo ("Company", "we", "us", and "our") uses cookies and similar ' +
                    'technologies to recognize you when you visit our Sites at ("Sites"). It explains what these ' +
                    'technologies are and why we use them, as well as your rights to control our use of them.<br/>' +
                    'In some cases we may use cookies to collect personal information, or that becomes personal ' +
                    'information if we combine it with other information.<br/>' +
                    '<br/>' +
                    'WHAT ARE COOKIES?<br/>' +
                    'Cookies are small data files that are placed on your computer or mobile device when you visit a ' +
                    'Site. Cookies are widely used by Site owners in order to make their Sites work, or to work ' +
                    'more efficiently, as well as to provide reporting information.<br/>' +
                    'Cookies set by the Site owner (in this case, Dymazoo) are called "first party cookies". Cookies set by ' +
                    'parties other than the Site owner are called "third party cookies". We do not make use of any third party cookies.<br/>' +
                    '<br/>' +
                    'WHY DO WE USE COOKIES?<br/>' +
                    'We only use first party "essential" cookies. These are required for technical reasons, in order for our platform to operate ' +
                    'and to allow us to track the usage of our platform so that we are able offer effective support. <br/>' +
                    '<br/>' +
                    'HOW CAN I CONTROL COOKIES?<br/>' +
                    '<br/>' +
                    'You have the right to decide whether to accept or reject cookies. Essential cookies cannot be rejected as they ' +
                    'are strictly necessary to provide you with services.<br/>' +
                    '<br/>' +
                    'WHAT ABOUT OTHER TRACKING TECHNOLOGIES, LIKE WEB BEACONS?<br/>' +
                    'Cookies are not the only way to recognize or track visitors to a Site. We may use other, similar ' +
                    'technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs").<br/>' +
                    'These are tiny graphics files that contain a unique identifier that enable us to recognize when someone ' +
                    'has visited our Sites or opened an e-mail including them. This allows us, for example, to ' +
                    'monitor the traffic patterns of users from one page within a Site to another, to deliver or ' +
                    'communicate with cookies, to understand whether you have come to the Site from an online ' +
                    'advertisement displayed on a third-party Site, to improve site performance, and to measure the ' +
                    'success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies ' +
                    'to function properly, and so declining cookies will impair their functioning.<br/>' +
                    '<br/>' +
                    'HOW OFTEN DO WE UPDATE THIS COOKIE POLICY?<br/>' +
                    'We may update this Cookie Policy from time to time in order to reflect, for example, changes to the ' +
                    'cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this ' +
                    'Cookie Policy regularly to stay informed about our use of cookies and related technologies.<br/>' +
                    'The date at the top of this Cookie Policy indicates when it was last updated.<br/>' +
                    '<br/>' +
                    'FURTHER INFORMATION?<br/>' +
                    'If you have any questions about our use of cookies or other technologies, please email us at<br/>' +
                    'contact@dymazoo.com or by post to:<br/>' +
                    'Dymazoo<br/>' +
                    'OFFICES A13-A14 CHAMPIONS BUSINESS PARK <br/>' +
                    'ARROWE BROOK ROAD <br/>' +
                    'WIRRAL <br/>' +
                    'ENGLAND <br/>' +
                    'CH49 0AB ',
                buttons: 'close2'
            }
        });
    }

}
