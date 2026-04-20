/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { Cr71a_clearancesBase, Cr71a_clearances } from '../models/Cr71a_clearancesModel';
import type { GetEntityMetadataOptions, EntityMetadata } from '@microsoft/power-apps/data/metadata/dataverse';
import type { IGetOptions, IGetAllOptions } from '../models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';


export class Cr71a_clearancesService {
  private static readonly dataSourceName = 'cr71a_clearances';

  private static readonly client = getClient(dataSourcesInfo);

  public static async create(record: Omit<Cr71a_clearancesBase, 'cr71a_clearanceid'>): Promise<IOperationResult<Cr71a_clearances>> {
    const result = await Cr71a_clearancesService.client.createRecordAsync<Omit<Cr71a_clearancesBase, 'cr71a_clearanceid'>, Cr71a_clearances>(
      Cr71a_clearancesService.dataSourceName,
      record
    );
    return result;
  }

  public static async update(id: string, changedFields: Partial<Omit<Cr71a_clearancesBase, 'cr71a_clearanceid'>>): Promise<IOperationResult<Cr71a_clearances>> {
    const result = await Cr71a_clearancesService.client.updateRecordAsync<Partial<Omit<Cr71a_clearancesBase, 'cr71a_clearanceid'>>, Cr71a_clearances>(
      Cr71a_clearancesService.dataSourceName,
      id.toString(),
      changedFields
    );
    return result;
  }

  public static async delete(id: string): Promise<void> {
    await Cr71a_clearancesService.client.deleteRecordAsync(
      Cr71a_clearancesService.dataSourceName,
      id.toString());
  }

  public static async get(id: string, options?: IGetOptions): Promise<IOperationResult<Cr71a_clearances>> {
    const result = await Cr71a_clearancesService.client.retrieveRecordAsync<Cr71a_clearances>(
      Cr71a_clearancesService.dataSourceName,
      id.toString(),
      options
    );
    return result;
  }

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<Cr71a_clearances[]>> {
    const result = await Cr71a_clearancesService.client.retrieveMultipleRecordsAsync<Cr71a_clearances>(
      Cr71a_clearancesService.dataSourceName,
      options
    );
    return result;
  }

  public static getMetadata(
    options: GetEntityMetadataOptions<Cr71a_clearances> = {}
  ): Promise<IOperationResult<Partial<EntityMetadata>>> {
    return Cr71a_clearancesService.client.executeAsync({
      dataverseRequest: {
        action: "getEntityMetadata",
        parameters: {
          tableName: Cr71a_clearancesService.dataSourceName,
          options: options as GetEntityMetadataOptions,
        },
      },
    });
  }
}
