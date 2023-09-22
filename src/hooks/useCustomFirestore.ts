import {addDoc, collection, doc} from "firebase/firestore";
import {
  useFirestore,
  useFirestoreCollectionData,
} from "reactfire";
import {CollectionNode, DocNode} from "../database";

const useDbCollection = (node: CollectionNode) => {
  const firestore = useFirestore();
  const {status, data, error} = useFirestoreCollectionData(
    collection(firestore, node.path)
  );

  return {
    status,
    data,
    error,
  };
};

export const useSaveDoc = async (node: DocNode, data: {[k: string]: any}) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, node.path)
  data.path = node.path;
  await addDoc(collection(firestore, node.collection.path), data)
  
};

export default useDbCollection;
