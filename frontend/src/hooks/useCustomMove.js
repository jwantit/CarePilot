import { useState } from "react"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"

const getNum  = (param, defaultValue) => {

  if(!param){
    return defaultValue
  }

  return parseInt(param)
}

const useCustomMove = (projectId, filter) => {

  const navigate = useNavigate()

  // 동일 페이지 클릭시 새로고침을 위한 상태 변수
    const [refresh, setRefresh] = useState(false)

  const [queryParams, setSearchParams] = useSearchParams()


  //현재 쿼리에서 가져온다 없으면 page=1&size=5 가 기본값으로 들어간다.
  const page = getNum(queryParams.get('page'), 1)
  const size = getNum(queryParams.get('size'),10)

  //?page=1&size=5
  const queryDefault = createSearchParams({page, size}).toString() 


  const moveToList = (params) => {
    const newSearchParams = new URLSearchParams(queryParams);
    
    // page와 size는 항상 포함
    const newPage = params.page ? params.page : page;
    const newSize = params.size ? params.size : size;
    newSearchParams.set("page", newPage.toString());
    newSearchParams.set("size", newSize.toString());
    
    // projectId와 filter도 유지
    if (projectId) {
      newSearchParams.set("projectId", projectId.toString());
    }
    if (filter && filter !== "ALL") {
      newSearchParams.set("filter", filter);
    }
    setSearchParams(newSearchParams);
    setRefresh(!refresh);
  };

      const moveToModify = (num) => {

    console.log(queryDefault)

    navigate({
      pathname: `../modify/${num}`,
      search: queryDefault  //수정시에 기존의 쿼리 스트링 유지를 위해 
    })
  
      }
  const moveToRead =(num) => {

    console.log(queryDefault)

    navigate({
      pathname: `../read/${num}`,
      search: queryDefault
    })
  }

  return  {moveToRead, moveToModify, moveToList, page, size,refresh} //refresh 추가 


}

export default useCustomMove