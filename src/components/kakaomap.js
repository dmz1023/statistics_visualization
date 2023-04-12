import {useEffect, useState } from "react";
import geomap from "../assets/geomap.json";
import geocity from "../assets/geocity.json";
import geocenter from "../assets/geocenter.json";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import property from "../store/property";
import './style/kakaomap.css'
import Showswitch from "./showswitch";

const { kakao } = window;

const Map = styled(Paper)(() => ({
    width: "400px", 
    height: "680px",
    borderRadius: property.borderRadius,
    textAlign: 'right'
  }));

export default function Kakaomap(props) {

    const [zoom, setZoom] = useState(false)
    const [cent, setCent] = useState([35.880147491722404, 127.7250280907668])
    const [level, setLevel] = useState(13)
    const [sido, setSido] = useState()


    useEffect(() => {
        let geoPoly
        zoom ? geoPoly = JSON.parse(JSON.stringify(geocity)) : geoPoly = JSON.parse(JSON.stringify(geomap))
        // const geoPoly = JSON.parse(JSON.stringify(geomap));
        // const geoPoly= JSON.parse(JSON.stringify(geocity));
        const geocentPos = JSON.parse(JSON.stringify(geocenter));

        // 객체 생성
        var areas = [];

        function setgeomapPoly(){
            for(let i=0; i<geoPoly.features.length;i++){
                // lat, lng 뽑아내기
                const areaInfo = {name:"",path:[]};
                const area = []

                areaInfo.name = geoPoly.features[i].properties.CTP_KOR_NM

                for(let j=0; j<geoPoly.features[i].geometry.coordinates.length; j++)
                {
                    
                    const sectionGeomap = [];

                    for(let k=0; k<geoPoly.features[i].geometry.coordinates[j].length; k++){
                        sectionGeomap.push(new kakao.maps.LatLng(geoPoly.features[i].geometry.coordinates[j][k][1], geoPoly.features[i].geometry.coordinates[j][k][0]));
                    }
                    area.push(sectionGeomap)
                }
                areaInfo.path = [...area];
                areas.push(areaInfo);
            } 
        }

        function setgeocityPoly(){
            for(let i=0; i<geoPoly.features.length;i++){
                if (geoPoly.features[i].properties.sidonm !== sido) continue

                // lat, lng 뽑아내기
                const areaInfo = {name:"",path:[]};
                const area = []

                areaInfo.name = geoPoly.features[i].properties.temp

                for(let j=0; j<geoPoly.features[i].geometry.coordinates.length; j++)
                {
                    const sectionGeocity = [];
                    for(let k=0; k<geoPoly.features[i].geometry.coordinates[j].length; k++){
                        for(let l=0; l<geoPoly.features[i].geometry.coordinates[j][k].length; l++){
                            sectionGeocity.push(new kakao.maps.LatLng(geoPoly.features[i].geometry.coordinates[j][k][l][1], geoPoly.features[i].geometry.coordinates[j][k][l][0]));
                        }
                    }

                    area.push(sectionGeocity)
                }
                areaInfo.path = [...area];
                areas.push(areaInfo);
            } 
        }
        zoom?setgeocityPoly():setgeomapPoly()
        // 객체 생성 완료

        let container = document.getElementById("map");
        let options = {
            center: new kakao.maps.LatLng(cent[0], cent[1]),
            level: level,
            disableDoubleClickZoom: true,
            draggable: false,
            zoomable: false
        };
        let map = new kakao.maps.Map(container, options);
        let customOverlay = new kakao.maps.CustomOverlay({});

        // 각 광역시도별 폴리곤 저장
        let polygons = [] 

        // 지도에 영역데이터를 폴리곤으로 표시합니다
        for (var i = 0, len = areas.length; i < len; i++) {
            displayArea(areas[i]);
        }

        function displayArea (area) {
            var polygon = new kakao.maps.Polygon({
                map:map,
                path:area.path,
                strokeWeight: 2,
                strokeColor: property.txtColor,
                strokeOpacity: 0.8,
                fillColor: '#fff',
                fillOpacity: 0.7
            });



            polygons.push(polygon)
            // 다각형에 mouseover 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 변경합니다
            // 지역명을 표시하는 커스텀오버레이를 지도위에 표시합니다
            kakao.maps.event.addListener(polygon, 'mouseover', function(mouseEvent) {
                polygon.setOptions({fillColor: property.mainColor});

                customOverlay.setContent('<div class="area">' + area.name + '</div>');

                customOverlay.setPosition(mouseEvent.latLng);
                customOverlay.setMap(map);
            });

            // 다각형에 mousemove 이벤트를 등록하고 이벤트가 발생하면 커스텀 오버레이의 위치를 변경합니다
            kakao.maps.event.addListener(polygon, 'mousemove', function(mouseEvent) {
                customOverlay.setPosition(mouseEvent.latLng);
            });

            // 다각형에 mouseout 이벤트를 등록하고 이벤트가 발생하면 폴리곤의 채움색을 원래색으로 변경합니다
            // 커스텀 오버레이를 지도에서 제거합니다
            kakao.maps.event.addListener(polygon, 'mouseout', function() {
                polygon.setOptions({fillColor: '#fff'});
                customOverlay.setMap(null);
            }); 

            // 다각형에 click 이벤트를 등록
            kakao.maps.event.addListener(polygon, 'click', function() {
                //클릭이벤트
                if (zoom) return;
                
                customOverlay.setMap(null);
                for(let i=0; i<polygons.length; i++) polygons[i].setMap(null)
                for(let i=0; i<geocentPos.length; i++) {
                    if(geocentPos[i].sidonm === area.name) {
                        setCent(geocentPos[i].coordinates)
                        setSido(area.name)
                    }
                }
                setLevel(12)
                setZoom(!zoom)
            });
            // 다각형에 dblclick 이벤트를 등록
            kakao.maps.event.addListener(map, 'dblclick', function() {
                //클릭이벤트
                if (!zoom) return;

                customOverlay.setMap(null);
                for(let i=0; i<polygons.length; i++) polygons[i].setMap(null)
                setCent([35.880147491722404, 127.7250280907668])
                setLevel(13)
                setSido()
                setZoom(!zoom)
            });
        }
    },[zoom, cent, sido, level]);

    return(
        <>
        <Map elevation={4} id="map"><Showswitch /></Map>
        </>
    )

};