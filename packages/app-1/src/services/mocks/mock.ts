import { faker } from '@faker-js/faker';

export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  createdAt: Date;
};
let i = 0;
export const newPerson = (): Person => {
  return {
    id: ++i,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int({ max: 60 }),
    createdAt: faker.date.past()
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!;
    return Array(len)
      .fill(0)
      .map(() => ({
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined
      }));
  };

  return makeDataLevel();
}
