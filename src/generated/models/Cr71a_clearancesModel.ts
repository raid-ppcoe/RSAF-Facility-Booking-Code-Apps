/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
export const Cr71a_clearancesstatecode = {
  0: 'Active',
  1: 'Inactive'
} as const;
export type Cr71a_clearancesstatecode = keyof typeof Cr71a_clearancesstatecode;
export const Cr71a_clearancesstatuscode = {
  1: 'Active',
  2: 'Inactive'
} as const;
export type Cr71a_clearancesstatuscode = keyof typeof Cr71a_clearancesstatuscode;

export interface Cr71a_clearancesBase {
  cr71a_clearanceid: string;
  cr71a_fullname: string;
  cr71a_rank: string;
  cr71a_phone: string;
  cr71a_email: string;
  cr71a_fieldsdata?: string;
  "cr71a_Booking@odata.bind": string;
  importsequencenumber?: string;
  overriddencreatedon?: string;
  ownerid: string;
  owneridtype: string;
  statecode: Cr71a_clearancesstatecode;
  statuscode?: Cr71a_clearancesstatuscode;
  timezoneruleversionnumber?: string;
  utcconversiontimezonecode?: string;
}

export interface Cr71a_clearances extends Cr71a_clearancesBase {
  statecodename?: string;
  statuscodename?: string;
  createdbyname?: string;
  createdbyyominame: string;
  createdon?: string;
  createdonbehalfbyname?: string;
  createdonbehalfbyyominame: string;
  modifiedbyname?: string;
  modifiedbyyominame: string;
  modifiedon?: string;
  modifiedonbehalfbyname?: string;
  modifiedonbehalfbyyominame: string;
  owneridname: string;
  owneridyominame: string;
  owningbusinessunitname: string;
  versionnumber?: string;
  cr71a_booking?: object;
  _cr71a_booking_value?: string;
  createdby?: object;
  _createdby_value?: string;
  createdonbehalfby?: object;
  _createdonbehalfby_value?: string;
  modifiedby?: object;
  _modifiedby_value?: string;
  modifiedonbehalfby?: object;
  _modifiedonbehalfby_value?: string;
  owningbusinessunit?: object;
  _owningbusinessunit_value?: string;
  owningteam?: object;
  _owningteam_value?: string;
  owninguser?: object;
  _owninguser_value?: string;
}
