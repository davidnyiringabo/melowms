import { DocumentData } from 'firebase/firestore';
import { useState, useCallback, useEffect } from 'react';
import { useTableContext } from '../context/TableContext';
import fuzzySearch from '../helpers/fuzzySearch';
import { toNormalCase } from './Table';
import { MdSearch } from 'react-icons/md';

export default function TableSearch() {
  const {
    initialData: data,
    columns = [],
    defaultSearchField,
    handleChangeFilteredData,
  } = useTableContext();
  const [searchData, setSearchData] = useState<DocumentData[]>([]);
  const [searchField, setSeachField] = useState<string>('');
  const [searchTerm, setSeachTerm] = useState<string>('');

  const filterData = useCallback(
    (data: DocumentData[]) => {
      if (!searchField || !searchTerm) return data;
      const results = fuzzySearch(
        data.map((d) => d[searchField]),
        searchTerm
      );
      const d = data.filter((d) => results.includes(d[searchField]));
      return d;
    },
    [searchField, searchTerm]
  );

  useEffect(() => {
    handleChangeFilteredData(searchData);
  }, [searchData]);

  useEffect(() => {
    if (defaultSearchField) {
      setSeachField(defaultSearchField);
    } else if (!searchField && !defaultSearchField) {
      setSeachField(columns[0]?.toString() ?? '');
    }
  }, [defaultSearchField]);

  useEffect(() => {
    if (searchTerm == '') {
      return setSearchData(data);
    }
    setSearchData(filterData(data));
  }, [searchTerm]);

  useEffect(() => {
    if (data && data.length) {
      setSearchData(filterData(data));
    }
  }, []);
  return (
    <div className="flex w-fit bg-white p-1 rounded items-center gap-2">
      <div className="flex  items-center border-black h-10 border-2 w-56 p-1 rounded">
        <MdSearch className="text-gray-500 h-full  text-2xl" />
        <input
          onChange={(e) => setSeachTerm(e.currentTarget.value)}
          type="text"
          className="border-0 px-2 p-1 placeholder:text-sm"
          placeholder={'Search'}
        />
      </div>
      <span className="text-xs font-bold">by</span>
      <select
        value={searchField}
        onChange={(e) => setSeachField(e.currentTarget.value)}
        className=""
      >
        {columns.map((col) => (
          <option value={col} className="" key={col}>
            {toNormalCase(col as string)[0].toUpperCase() +
              toNormalCase(col as string)
                .slice(1)
                .toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
