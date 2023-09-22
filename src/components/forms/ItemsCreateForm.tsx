import { Items } from '../../database';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { toast } from '../ToasterContext';
import DynamicForm from './Form';
import {
  CodeArray,
  CountryData,
  countryData,
  itemClassCodes,
  itemTypeCode,
  packageUnitCodes,
  quantityUnitCodes,
  taxTypeCodes,
} from '../../data/itemCodesData';
import { getOptions } from './PurchaseForm';
import { getDocs, query, where } from 'firebase/firestore';

const ItemSchema = z.object({
  name: z.string().min(2),
  // code: z.string().regex(/\d+/, 'Should be numeric'),
  taxCode: z.enum(getCodeEnums(taxTypeCodes)).default('B'),
  itemClass: z.enum(getCodeEnums(itemClassCodes)).default('5124184200'),
  countryOfOrigin: z.enum(getCountryEnums(countryData)).default('rw'),
  itemType: z.enum(getCodeEnums(itemTypeCode)).default('2'),
  purchaseUnitPrice: z.number().step(0.01).min(0),
  sellingUnitPrice: z.number().step(0.01).min(0),
  branchPurchaseUnitPrice: z.number().step(0.01).min(0),
  branchSellingUnitPrice: z.number().step(0.01).min(0),
  insuranceApplicable: z.literal(false),
  nonTaxableAmount: z.number().default(300),
  packageCapacity: z.number().min(1).default(1),
  packageUnit: z.enum(getCodeEnums(packageUnitCodes)).default('BC'),
  quantityUnit: z.enum(getCodeEnums(quantityUnitCodes)).default('L'),
  // barcode: z.string().min(1).default('------').optional(),
});

type ItemSchemaType = z.infer<typeof ItemSchema>;

const ItemsCreateForm = ({ instance }: { instance?: { [k: string]: any } }) => {
  const handleCreateItem: SubmitHandler<ItemSchemaType> = async (data) => {
    const itemQuery = query(
      Items.ref,
      where('item_name', '==', itemize(data.name))
    );

    if (!instance) {
      const exists = (await getDocs(itemQuery)).size > 0;
      if (exists) {
        return toast.error('This item already exists!');
      }
      await Items.addDoc({ ...data, item_name: itemize(data.name) });
    } else {
      await Items.doc(instance.id).save({
        ...data,
        item_name: itemize(data.name),
      });
    }
    toast.success(`Item ${data.name} was ${instance ? 'updated' : 'created'}!`);
  };

  return (
    <DynamicForm
      multiLevel={true}
      inputsPerLevel={5}
      instance={instance}
      schema={ItemSchema}
      onSubmit={handleCreateItem}
      metadata={{
        insuranceApplicable: {
          helpText: 'Check if this product can be paid by insurance',
        },
        nonTaxableAmount: { hidden: true },
        // barcode: { hidden: true },
        branchPurchaseUnitPrice: {
          watchFields: ['purchaseUnitPrice'],
          calculate({ fields, value, setValue }) {
            const [puPrice] = fields;
            if (!value) setValue('branchPurchaseUnitPrice', puPrice);
          },
        },
        branchSellingUnitPrice: {
          watchFields: ['sellingUnitPrice'],
          calculate({ fields, value, setValue }) {
            const [sPrice] = fields;
            if (!value) setValue('branchSellingUnitPrice', sPrice + 200);
          },
        },
        countryOfOrigin: {
          options: getOptions({
            choices: countryData,
            display: 'name',
            hidden: 'iso2',
          }),
        },
        packageUnit: {
          options: getOptions({
            choices: packageUnitCodes,
            display: 'codeName',
            hidden: 'code',
          }),
        },
        itemClass: {
          options: getOptions({
            choices: itemClassCodes,
            display: 'codeName',
            hidden: 'code',
          }),
        },
        quantityUnit: {
          options: getOptions({
            choices: quantityUnitCodes,
            display: 'codeName',
            hidden: 'code',
          }),
        },
        itemType: {
          options: getOptions({
            choices: itemTypeCode,
            display: 'codeName',
            hidden: 'code',
          }),
        },
        taxCode: {
          options: getOptions({
            choices: taxTypeCodes,
            display: 'codeName',
            hidden: 'code',
          }),
        },
      }}
    />
  );
};

export function itemize(itemName: string) {
  return itemName.toLowerCase().replaceAll(' ', '');
}

export default ItemsCreateForm;

export function getCodeEnums(codes: CodeArray) {
  const [first, ...rest] = codes.map((code) => code.code.toUpperCase());

  return [first.toString() as string, ...rest] as const;
}

export function getCountryEnums(countryData: CountryData) {
  const [first, ...rest] = countryData.map((c) => c.iso2);

  return [first, ...rest] as const;
}
